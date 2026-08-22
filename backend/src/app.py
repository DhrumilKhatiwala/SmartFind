import sys
from contextlib import asynccontextmanager
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from src.schemas import SearchRequest, DocumentResult, SearchResponse
from src.services import (
    init_metadata_dataset,
    enrich_with_parquet_metadata,
    product_lookup,
    sanitize_pinecone_filter,
    format_ast_constraints,
    rerank_products,
    generate_structured_explanation,
)
from src.retriever import initialize_self_query_retriever

# Global singletons
retriever_instance: Any = None
SEARCH_CACHE: Dict[str, SearchResponse] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for warm-up and graceful shutdown.
    Pre-initializes the SelfQueryRetriever and memory-mapped Parquet scanner.
    """
    global retriever_instance
    print("Pre-initializing SelfQueryRetriever and connecting to Pinecone Cloud...")
    try:
        retriever_instance = initialize_self_query_retriever(search_k=500)
        print("SelfQueryRetriever pre-initialized successfully.")
    except Exception as err:
        print(f"Error during retriever initialization: {err}")
        raise err

    init_metadata_dataset()
    yield
    print("Shutting down FastAPI application...")


# Initialize FastAPI application
app = FastAPI(
    title="SmartFind Vector Search API",
    description="Natural-language product search with dynamic metadata filtering using Groq and Pinecone Cloud Vector Store.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """
    Root landing endpoint providing service health and interactive documentation links.
    """
    return {
        "service": "SmartFind AI Product Search API",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "search_url": "POST /search",
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify backend operational readiness.
    """
    is_ready = retriever_instance is not None
    return {
        "status": "healthy" if is_ready else "degraded",
        "service": "SmartFind Vector Search API",
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
    """
    End-to-end constraint-aware search:
    1. Fast in-memory cache check (0.001ms)
    2. Groq AST Query Decomposition (intent + numeric rules)
    3. Pinecone Filtered Vector Search
    4. Product-Anchor Re-ranking Pass (demotes accessories, boosts genuine hardware)
    5. Parquet metadata enrichment & structured explainability reasoning
    """
    if retriever_instance is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SelfQueryRetriever service is not initialized.",
        )

    # 1. Fast Cache Lookup
    cache_key = f"{payload.query.strip().lower()}__top{payload.top_k}"
    if cache_key in SEARCH_CACHE:
        return SEARCH_CACHE[cache_key]

    try:
        # 2. Single-Pass LLM Query Decomposition via Groq AST
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
                        detail="Groq API rate limit reached. Please retry in a few moments.",
                    )
                raise qc_err

        # 3. Fast AST Translation to Pinecone Boolean Filter
        semantic_query = payload.query
        pinecone_filter = None
        if structured_query:
            semantic_query, search_kwargs = (
                retriever_instance.structured_query_translator.visit_structured_query(
                    structured_query
                )
            )
            pinecone_filter = search_kwargs.get("filter")

        # 4. Pinecone Filter Sanitization & Category Synonym Normalization
        sanitized_filter = (
            sanitize_pinecone_filter(pinecone_filter) if pinecone_filter else None
        )

        # 5. Non-blocking Vector Search in Threadpool
        search_filter_kwargs = (
            {"filter": sanitized_filter} if sanitized_filter else {}
        )
        raw_docs = await run_in_threadpool(
            retriever_instance.vectorstore.similarity_search,
            query=semantic_query or payload.query,
            k=payload.top_k,
            **search_filter_kwargs,
        )

        # 6. Product-Anchor Re-ranking Layer (Boosts genuine devices, demotes companion accessories)
        extracted_intent = (
            semantic_query.strip()
            if semantic_query and semantic_query.strip()
            else (structured_query.query.strip() if structured_query and structured_query.query else payload.query)
        )
        ranked_docs = rerank_products(extracted_intent, raw_docs)

        # 7. Fast Vectorized Metadata Enrichment from Parquet (0MB RAM)
        enrich_with_parquet_metadata(ranked_docs)

        # 8. Deterministic Explainability Generation
        formatted_results: List[DocumentResult] = []
        for doc in ranked_docs:
            explanation = generate_structured_explanation(
                page_content=doc.page_content,
                metadata=doc.metadata,
                query_str=payload.query,
                structured_query=structured_query,
            )
            formatted_results.append(
                DocumentResult(
                    page_content=doc.page_content,
                    metadata=doc.metadata,
                    explanation=explanation,
                )
            )

        # 9. Format structured AST constraints for client showcase
        detected_constraints = format_ast_constraints(structured_query)

        response = SearchResponse(
            query=payload.query,
            count=len(formatted_results),
            semantic_intent=extracted_intent,
            detected_constraints=detected_constraints,
            results=formatted_results,
        )

        # Cache valid search response
        SEARCH_CACHE[cache_key] = response
        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error performing search: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while performing search: {str(e)}",
        )
