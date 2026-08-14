import re
from typing import Any, Dict, List, Optional
from langchain_core.structured_query import Comparison, Operation, StructuredQuery


def extract_comparisons(structured_filter: Any) -> List[Comparison]:
    """
    Recursively extracts all atomic Comparison objects from a StructuredQuery filter AST.
    """
    if structured_filter is None:
        return []

    comparisons: List[Comparison] = []
    if isinstance(structured_filter, Comparison):
        comparisons.append(structured_filter)
    elif isinstance(structured_filter, Operation):
        for arg in getattr(structured_filter, "arguments", []):
            comparisons.extend(extract_comparisons(arg))
    return comparisons


def format_comparator_symbol(comparator: Any) -> str:
    """
    Converts LangChain Comparator enum or string to clean human-readable symbol.
    """
    comp_val = getattr(comparator, "value", str(comparator)).lower()
    symbol_map = {
        "eq": "=",
        "equal": "=",
        "ne": "!=",
        "gt": ">",
        "gte": ">=",
        "lt": "<",
        "lte": "<=",
        "contain": "contains",
        "like": "contains",
    }
    return symbol_map.get(comp_val, comp_val)


def generate_structured_explanation(
    structured_query: Optional[StructuredQuery],
    raw_query: str,
    document_content: str,
    metadata: Dict[str, Any],
) -> str:
    """
    Generates a concise, human-readable explanation of why a retrieved product matched,
    using the actual parsed semantic query and metadata filters from SelfQueryRetriever.
    """
    doc_text = (document_content or "").lower()
    metadata = metadata or {}
    explanation_parts: List[str] = []

    # 1. Determine Semantic Match Explanation
    semantic_term = (
        structured_query.query.strip()
        if (structured_query and getattr(structured_query, "query", None))
        else raw_query.strip()
    )

    if semantic_term:
        # Extract meaningful tokens (length > 2)
        tokens = [t for t in re.findall(r"[a-z0-9]+", semantic_term.lower()) if len(t) > 2]
        matched_tokens = [t for t in tokens if t in doc_text]

        if matched_tokens:
            token_list = ", ".join(f'"{t}"' for t in matched_tokens)
            explanation_parts.append(f"Matched keywords: {token_list}")
        else:
            explanation_parts.append(
                f'Matched "{semantic_term}" via semantic vector similarity'
            )
    else:
        explanation_parts.append("Matched via semantic vector similarity")

    # 2. Extract and Explain Active Metadata Filters from Retriever AST
    active_filters = (
        extract_comparisons(structured_query.filter)
        if (structured_query and getattr(structured_query, "filter", None))
        else []
    )

    filter_explanations: List[str] = []
    for comp in active_filters:
        attr = getattr(comp, "attribute", "")
        comp_symbol = format_comparator_symbol(getattr(comp, "comparator", ""))
        target_val = getattr(comp, "value", None)
        actual_val = metadata.get(attr)

        if attr == "price" and actual_val is not None and target_val is not None:
            try:
                target_num = float(target_val)
                actual_num = float(actual_val)
                filter_explanations.append(
                    f"Price ₹{actual_num:,.0f} satisfies filter ({comp_symbol} ₹{target_num:,.0f})"
                )
            except (ValueError, TypeError):
                filter_explanations.append(f"Price ₹{actual_val} ({comp_symbol} {target_val})")

        elif attr == "rating" and actual_val is not None and target_val is not None:
            try:
                target_num = float(target_val)
                actual_num = float(actual_val)
                filter_explanations.append(
                    f"Rating {actual_num:.1f}★ satisfies filter ({comp_symbol} {target_num:.1f}★)"
                )
            except (ValueError, TypeError):
                filter_explanations.append(f"Rating {actual_val}★ ({comp_symbol} {target_val}★)")

        elif attr == "category" and actual_val is not None:
            filter_explanations.append(
                f'Category "{actual_val}" matches requested category'
            )

    if filter_explanations:
        explanation_parts.extend(filter_explanations)
    else:
        # If no metadata filters were applied in user query
        explanation_parts.append("No metadata filters applied (pure semantic match)")

    return " • ".join(explanation_parts)
