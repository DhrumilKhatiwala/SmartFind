import os
from contextlib import asynccontextmanager
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
        10,
        ge=1,
        le=50,
        description="Maximum number of top results to return (defaults to 10)",
    )


class ProductMetadata(BaseModel):
    price: Optional[float] = Field(None, description="Product price in INR")
    rating: Optional[float] = Field(None, description="Customer review rating (0.0 to 5.0)")
    category: Optional[str] = Field(None, description="Product category/department")


class DocumentResult(BaseModel):
    page_content: str = Field(..., description="Combined product name and sub-category")
    metadata: ProductMetadata = Field(..., description="Structured product metadata")


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[DocumentResult]


# Pre-initialized retriever state
retriever_instance = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever_instance
    print("Pre-initializing SelfQueryRetriever (top_k=10) and connecting to Pinecone Cloud...")
    try:
        retriever_instance = initialize_self_query_retriever(search_k=10)
        print("SelfQueryRetriever pre-initialized successfully.")
    except Exception as err:
        print(f"Error during startup initialization: {err}")
        raise err
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

    try:
        # Execute query against pre-initialized SelfQueryRetriever
        raw_docs = retriever_instance.invoke(payload.query)[: payload.top_k]

        # Format retrieved LangChain Documents into clean Pydantic response
        formatted_results: List[DocumentResult] = []
        for doc in raw_docs:
            meta = doc.metadata or {}
            formatted_results.append(
                DocumentResult(
                    page_content=doc.page_content,
                    metadata=ProductMetadata(
                        price=meta.get("price"),
                        rating=meta.get("rating"),
                        category=meta.get("category"),
                    ),
                )
            )

        return SearchResponse(
            query=payload.query,
            count=len(formatted_results),
            results=formatted_results,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while performing search: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.app:app", host="0.0.0.0", port=8000, reload=True)
