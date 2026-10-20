import os
import base64
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from starlette.concurrency import run_in_threadpool

from src.vectorstore import load_pinecone_vector_db
from src.services.metadata import enrich_with_parquet_metadata
from src.schemas.cart import RecommendationProduct, CartRecommendationsResponse


class CartIntentAnalysis(BaseModel):
    """Pydantic model for LangChain structured JSON output parsing."""
    theme: str = Field(
        default="Recommended for You",
        description="Concise 3-5 word summary theme of the cart, e.g. 'OnePlus Mobile Essentials' or 'Gaming Battle Station'",
    )
    reason: str = Field(
        default="Accessories specifically chosen to complement your cart items.",
        description="A compelling, helpful 1-sentence customer explanation (10-18 words) explaining why these items pair with their cart",
    )
    target_queries: List[str] = Field(
        default_factory=list,
        description="2 to 3 distinct, specific search queries for different complementary product types (e.g. ['OnePlus dash fast charger', 'OnePlus protective case cover', 'phone desk stand']). NEVER repeat items already in the cart.",
    )
    avoid_keywords: List[str] = Field(
        default_factory=list,
        description="Specific incompatible brand or product words to strictly exclude (e.g. ['iPhone', 'Apple', 'Lightning'] if an Android device is in the cart, or ['women', 'dress'] if men's shoes).",
    )


# Module-level singleton for LangChain LCEL chain
_recommendation_chain = None


def get_cart_recommendation_chain():
    """Lazily initializes the LangChain LCEL chain for cart intent analysis."""
    global _recommendation_chain
    if _recommendation_chain is not None:
        return _recommendation_chain

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    model_name = os.getenv("GROQ_CART_MODEL", "qwen/qwen3.8-27b")
    llm = ChatGroq(
        model=model_name,
        temperature=0.2,
        groq_api_key=api_key,
    )

    parser = JsonOutputParser(pydantic_object=CartIntentAnalysis)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert e-commerce recommendation system for an online marketplace. "
            "Your job is to recommend SMART COMPLEMENTARY ACCESSORIES AND PAIRINGS for the user's cart.\n"
            "Rules:\n"
            "1. NEVER recommend the same product type that is already in the cart (e.g. if cart has a laptop, do NOT recommend another laptop; recommend a mouse, laptop bag, cooling pad, or USB hub).\n"
            "2. RESPECT ECOSYSTEM & BRANDS: If cart has an Android phone (OnePlus, Samsung, Xiaomi, etc.), NEVER recommend Apple/iPhone/Lightning accessories. If cart has Men's shoes, do NOT recommend Women's clothing or socks.\n"
            "3. PROVIDE 2 TO 3 DIVERSE TARGET QUERIES so recommendations span distinct complementary accessory types rather than multiple of the same item.\n"
            "4. Write a friendly, natural 'reason' explaining the value of these complementary pairings.\n\n"
            "{format_instructions}",
        ),
        (
            "human",
            "Current Shopping Cart Items:\n{cart_items}\n\n"
            "Generate the smart pairing plan in JSON format.",
        ),
    ]).partial(format_instructions=parser.get_format_instructions())

    _recommendation_chain = prompt | llm | parser
    return _recommendation_chain


async def generate_cart_recommendations_rag(
    items: List[Any],
    exclude_ids: List[str],
    limit: int = 8,
) -> CartRecommendationsResponse:
    """
    Executes LangChain RAG pipeline for cart recommendations:
    1. Cart Intent Analysis via LangChain LCEL chain (theme, reason, target_queries, avoid_keywords).
    2. Multi-query vector retrieval with negative keyword filtering.
    3. Cross-query round-robin interleaving to guarantee diverse accessory categories.
    4. Quality and duplicate filtering (excluding cart items, low ratings, bad images).
    5. Zero-RAM Parquet metadata enrichment.
    """
    if not items:
        return CartRecommendationsResponse(recommendations=[])

    titles = [it.title.strip() for it in items if getattr(it, "title", None) and it.title.strip()]
    categories = list({it.category.strip() for it in items if getattr(it, "category", None) and it.category.strip()})

    theme = "Recommended for You"
    reason = "Accessories curated to pair with your cart items."
    target_queries = []
    avoid_keywords = []

    # 1. Run LangChain cart intent summarization chain
    chain = get_cart_recommendation_chain()
    if chain and titles:
        cart_items_text = "\n".join(
            f"- {it.title} ({it.category or 'General'})"
            for it in items[:6]
            if getattr(it, "title", None)
        )
        try:
            analysis: Dict[str, Any] = await run_in_threadpool(
                chain.invoke,
                {"cart_items": cart_items_text},
            )
            if isinstance(analysis, dict):
                theme = analysis.get("theme") or theme
                reason = analysis.get("reason") or reason
                raw_queries = analysis.get("target_queries") or []
                if isinstance(raw_queries, str):
                    raw_queries = [raw_queries]
                target_queries = [q.strip() for q in raw_queries if isinstance(q, str) and q.strip()]
                raw_avoids = analysis.get("avoid_keywords") or []
                if isinstance(raw_avoids, str):
                    raw_avoids = [raw_avoids]
                avoid_keywords = [a.strip().lower() for a in raw_avoids if isinstance(a, str) and a.strip()]
        except Exception as err:
            print(f"[LangChain Cart RAG] LLM intent extraction fallback: {err}")

    # Fallback if no target queries were generated
    if not target_queries:
        fallback_query = " ".join((titles[:3] + categories)).strip()
        if fallback_query:
            target_queries = [fallback_query]

    if not target_queries:
        return CartRecommendationsResponse(recommendations=[])

    # 2. Multi-query retrieval via LangChain PineconeVectorStore
    try:
        vectorstore = load_pinecone_vector_db()
        exclude_set = set(exclude_ids)
        cart_titles_lower = {t.lower() for t in titles}

        candidates_per_query: List[List[Any]] = []
        global_seen_ids = set()
        global_seen_titles = set()

        for q in target_queries[:3]:
            # Retrieve top-k candidates for each distinct sub-query
            raw_docs = await run_in_threadpool(
                vectorstore.similarity_search,
                query=q,
                k=10,
            )

            query_candidates = []
            for doc in raw_docs:
                content_lower = doc.page_content.lower()

                # Check avoid keywords
                if any(bad in content_lower for bad in avoid_keywords):
                    continue

                doc_id = base64.b64encode(doc.page_content[:100].encode("utf-8")).decode("ascii")[:40]
                parts = doc.page_content.split(" - ")
                prod_title = parts[0].strip() if len(parts) > 1 else doc.page_content.strip()
                title_lower = prod_title.lower()

                if doc_id in exclude_set or doc_id in global_seen_ids:
                    continue
                if title_lower in cart_titles_lower or title_lower in global_seen_titles:
                    continue

                global_seen_ids.add(doc_id)
                global_seen_titles.add(title_lower)

                doc.metadata["_computed_id"] = doc_id
                doc.metadata["_computed_title"] = prod_title
                query_candidates.append(doc)

            candidates_per_query.append(query_candidates)

        # 3. Round-Robin Interleave across distinct target queries for maximum diversity
        interleaved_docs = []
        max_depth = max((len(c) for c in candidates_per_query), default=0)
        for depth in range(max_depth):
            for c_list in candidates_per_query:
                if depth < len(c_list) and len(interleaved_docs) < limit * 2:
                    interleaved_docs.append(c_list[depth])

        # If interleaving yielded too few items, fall back to any remaining candidates
        if len(interleaved_docs) < limit:
            for c_list in candidates_per_query:
                for doc in c_list:
                    if doc not in interleaved_docs and len(interleaved_docs) < limit:
                        interleaved_docs.append(doc)

        # 4. Enrich candidates with Parquet metadata
        enrich_with_parquet_metadata(interleaved_docs)

        # 5. Format response items
        recommendations = []
        for doc in interleaved_docs[:limit]:
            m = doc.metadata or {}
            recommendations.append(
                RecommendationProduct(
                    product_id=m.get("_computed_id"),
                    title=m.get("_computed_title") or doc.page_content,
                    price=m.get("price"),
                    rating=m.get("rating"),
                    category=m.get("category"),
                    sub_category=m.get("sub_category"),
                    image=m.get("image"),
                    actual_price=m.get("actual_price"),
                    no_of_ratings=m.get("no_of_ratings"),
                    page_content=doc.page_content,
                )
            )

        return CartRecommendationsResponse(
            theme=theme,
            reason=reason,
            recommendations=recommendations,
        )

    except Exception as e:
        print(f"[LangChain Cart RAG] Retrieval error: {e}")
        return CartRecommendationsResponse(
            theme=theme,
            reason=reason,
            recommendations=[],
        )
