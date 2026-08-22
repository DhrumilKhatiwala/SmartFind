from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query with optional constraints.")
    top_k: int = Field(500, ge=1, le=1000, description="Maximum number of products to retrieve.")


class DocumentResult(BaseModel):
    page_content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    explanation: Optional[str] = Field(
        None, description="Human-readable explainability reasoning for this match."
    )


class SearchResponse(BaseModel):
    query: str
    count: int
    semantic_intent: Optional[str] = None
    detected_constraints: List[str] = Field(default_factory=list)
    results: List[DocumentResult]
