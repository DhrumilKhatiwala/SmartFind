import os
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.explainer import generate_structured_explanation
from src.retriever import initialize_self_query_retriever

# Load environment configuration (.env)
load_dotenv()


# Pydantic Schemas for Request & Response validation
class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        description="Natural language query string (e.g. 'phones under 20000 with rating above 4')",
        examples=["headphones under 2000"],
    )
    top_k: int = Field(
        50,
        ge=1,
        le=100,
        description="Maximum number of top results to return (defaults to 50)",
    )



class ProductMetadata(BaseModel):
    price: Optional[float] = Field(None, description="Product price in INR")
    rating: Optional[float] = Field(None, description="Customer review rating (0.0 to 5.0)")
    category: Optional[str] = Field(None, description="Product category/department")
    image: Optional[str] = Field(None, description="Product image URL")
    no_of_ratings: Optional[str] = Field(None, description="Number of customer reviews/ratings")
    actual_price: Optional[str] = Field(None, description="Original/MRP price in INR")
    discount_price: Optional[str] = Field(None, description="Discounted price string")



class DocumentResult(BaseModel):
    page_content: str = Field(..., description="Combined product name and sub-category")
    metadata: ProductMetadata = Field(..., description="Structured product metadata")
    explanation: Optional[str] = Field(
        None,
        description="Concise human-readable explanation of semantic match and satisfied metadata filters",
    )


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[DocumentResult]



# In-memory application state & query cache
retriever_instance = None
product_lookup: Dict[str, dict] = {}
SEARCH_CACHE: Dict[str, SearchResponse] = {}


def load_product_metadata_lookup() -> Dict[str, dict]:
    """
    Builds a fast in-memory dictionary mapping product names and combined text
    to rich Amazon metadata (images, links, ratings count, actual price).
    """
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_candidates = [
        os.path.join(workspace_dir, "data", "amazon.csv"),
        os.path.join(workspace_dir, "backend", "data", "amazon.csv"),
        os.path.join("data", "amazon.csv"),
        os.path.join("backend", "data", "amazon.csv"),
    ]

    csv_path = next((p for p in csv_candidates if os.path.exists(p)), None)
    if not csv_path:
        print("Warning: amazon.csv not found for metadata enrichment.")
        return {}

    print(f"Loading metadata lookup from: {csv_path}...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
        lookup = {}
        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()
            sub_cat = str(row.get("sub_category", "")).strip()
            combined_text = f"{name} - {sub_cat}".strip(" -")

            raw_img = row.get("image")
            raw_link = row.get("link")
            raw_num_ratings = row.get("no_of_ratings")
            raw_actual_price = row.get("actual_price")
            raw_discount_price = row.get("discount_price")

            info = {
                "image": str(raw_img).strip() if pd.notna(raw_img) and str(raw_img).startswith("http") else None,
                "link": str(raw_link).strip() if pd.notna(raw_link) and str(raw_link).startswith("http") else None,
                "no_of_ratings": str(raw_num_ratings).strip() if pd.notna(raw_num_ratings) else None,
                "actual_price": str(raw_actual_price).strip() if pd.notna(raw_actual_price) else None,
                "discount_price": str(raw_discount_price).strip() if pd.notna(raw_discount_price) else None,
            }

            if combined_text and combined_text not in lookup:
                lookup[combined_text] = info
            if name and name not in lookup:
                lookup[name] = info
            # Also index by lowercase for case-insensitive fallback
            if combined_text:
                lookup[combined_text.lower()] = info
            if name:
                lookup[name.lower()] = info

        print(f"Successfully cached rich metadata for {len(lookup):,} product entries.")
        return lookup
    except Exception as e:
        print(f"Error building metadata lookup table: {e}")
        return {}


def sanitize_pinecone_filter(filter_obj):
    """
    Recursively sanitizes Pinecone metadata filter dictionaries to ensure:
    - Numeric fields ('price', 'rating') are strictly converted to float/int, not strings.
    - Resolves Pinecone 400 error: 'the $gt operator must be followed by a number, got string instead'.
    """
    if not isinstance(filter_obj, dict):
        return filter_obj

    sanitized = {}
    for key, value in filter_obj.items():
        if key in ("price", "rating"):
            if isinstance(value, dict):
                inner = {}
                for op, op_val in value.items():
                    try:
                        clean_str = str(op_val).replace(",", "").strip()
                        inner[op] = float(clean_str)
                    except (ValueError, TypeError):
                        inner[op] = op_val
                sanitized[key] = inner
            else:
                try:
                    sanitized[key] = float(str(value).replace(",", "").strip())
                except (ValueError, TypeError):
                    sanitized[key] = value
        elif key in ("$and", "$or") and isinstance(value, list):
            sanitized[key] = [sanitize_pinecone_filter(item) for item in value if item]
        else:
            sanitized[key] = (
                sanitize_pinecone_filter(value) if isinstance(value, dict) else value
            )
    return sanitized


@asynccontextmanager
async def lifespan(app: FastAPI):

    global retriever_instance, product_lookup
    print("Pre-initializing SelfQueryRetriever and connecting to Pinecone Cloud...")
    try:
        retriever_instance = initialize_self_query_retriever(search_k=50)

        print("SelfQueryRetriever pre-initialized successfully.")
    except Exception as err:
        print(f"Error during retriever initialization: {err}")
        raise err

    # Load rich product metadata into memory
    product_lookup = load_product_metadata_lookup()
    yield
    print("Shutting down FastAPI application...")


# FastAPI Application Setup
app = FastAPI(
    title="QueryForge Vector Search API",
    description="Production-ready FastAPI endpoint serving LangChain SelfQueryRetriever over Pinecone Cloud Vector Store.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS Middleware for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configurable for production React frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Check Application and Vector Retriever Health Status",
)
async def health_check():
    is_ready = retriever_instance is not None
    return {
        "status": "healthy" if is_ready else "degraded",
        "service": "QueryForge Vector Search API",
        "retriever": "ready" if is_ready else "uninitialized",
        "vectorstore": "Pinecone Cloud",
        "cached_products": len(product_lookup),
        "cached_queries": len(SEARCH_CACHE),
    }


@app.post(
    "/search",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Natural Language Vector Search with Metadata Filtering",
)
async def search_products(payload: SearchRequest):
    if retriever_instance is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SelfQueryRetriever service is not initialized.",
        )

    # 1. Fast Cache Lookup (0.001 ms for repeated queries)
    cache_key = f"{payload.query.strip().lower()}__top{payload.top_k}"
    if cache_key in SEARCH_CACHE:
        return SEARCH_CACHE[cache_key]

    try:
        from starlette.concurrency import run_in_threadpool

        # 1. Non-blocking Single-Pass LLM Execution
        structured_query = None
        if hasattr(retriever_instance, "query_constructor"):
            try:
                structured_query = await run_in_threadpool(
                    retriever_instance.query_constructor.invoke, {"query": payload.query}
                )
            except Exception as qc_err:
                err_str = str(qc_err)
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Gemini API Quota Exceeded (429). Please update your GEMINI_API_KEY in backend/.env.",
                    )
                raise qc_err

        # 2. Fast AST Translation to Pinecone Filter (0ms, eliminates duplicate LLM invocation)
        semantic_query = payload.query
        pinecone_filter = None
        if structured_query:
            semantic_query, search_kwargs = (
                retriever_instance.structured_query_translator.visit_structured_query(
                    structured_query
                )
            )
            raw_filter = search_kwargs.get("filter") if search_kwargs else None
            pinecone_filter = sanitize_pinecone_filter(raw_filter) if raw_filter else None

        # 3. Non-blocking Direct Pinecone Vector Search with Sanitized Filter
        if pinecone_filter:
            try:
                raw_docs = await run_in_threadpool(
                    retriever_instance.vectorstore.similarity_search,
                    semantic_query or payload.query,
                    k=payload.top_k,
                    filter=pinecone_filter,
                )
            except Exception as pinecone_err:
                print(f"Pinecone filter fallback ({pinecone_err}). Running similarity search without filter...")
                raw_docs = await run_in_threadpool(
                    retriever_instance.vectorstore.similarity_search,
                    semantic_query or payload.query,
                    k=payload.top_k,
                )
        else:
            raw_docs = await run_in_threadpool(
                retriever_instance.vectorstore.similarity_search,
                semantic_query or payload.query,
                k=payload.top_k,
            )







        # 4. Format retrieved documents into response with enriched metadata & explanation
        formatted_results: List[DocumentResult] = []
        for doc in raw_docs:
            meta = doc.metadata or {}
            content = doc.page_content.strip()

            # Attempt lookup by full page_content, product name prefix, or lowercase
            name_part = content.split(" - ")[0].strip() if " - " in content else content
            extra_info = (
                product_lookup.get(content)
                or product_lookup.get(name_part)
                or product_lookup.get(content.lower())
                or product_lookup.get(name_part.lower())
                or {}
            )

            # Generate concise, human-readable explanation using actual parsed filters
            explanation = generate_structured_explanation(
                structured_query=structured_query,
                raw_query=payload.query,
                document_content=content,
                metadata=meta,
            )

            formatted_results.append(
                DocumentResult(
                    page_content=content,
                    metadata=ProductMetadata(
                        price=meta.get("price"),
                        rating=meta.get("rating"),
                        category=meta.get("category"),
                        image=extra_info.get("image"),
                        no_of_ratings=extra_info.get("no_of_ratings"),
                        actual_price=extra_info.get("actual_price"),
                        discount_price=extra_info.get("discount_price"),
                    ),
                    explanation=explanation,
                )
            )


        response = SearchResponse(
            query=payload.query,
            count=len(formatted_results),
            results=formatted_results,
        )

        # Cache response for instant repeat queries
        SEARCH_CACHE[cache_key] = response
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while performing search: {str(e)}",
        )




if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.app:app", host="0.0.0.0", port=8000, reload=True)

