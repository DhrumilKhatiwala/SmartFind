from typing import Dict, Any, List


def generate_structured_explanation(
    page_content: str, metadata: Dict[str, Any], query_str: str, structured_query: Any
) -> str:
    """
    Generates human-readable explainability reasoning for why a product matched:
    - Lists matched semantic search keywords.
    - Explicitly explains which numeric and categorical metadata constraints were satisfied.
    """
    explanations: List[str] = []

    # 1. Semantic Match Explanation
    semantic_intent = (
        getattr(structured_query, "query", "").strip() if structured_query else ""
    )
    if semantic_intent and semantic_intent.lower() in page_content.lower():
        explanations.append(f'Matched keywords: "{semantic_intent}"')
    elif semantic_intent:
        explanations.append(f'Matched "{semantic_intent}" via semantic vector similarity')
    else:
        words = [w for w in query_str.lower().split() if len(w) > 3]
        matched_words = [w for w in words if w in page_content.lower()]
        if matched_words:
            matched_formatted = ", ".join([f'"{w}"' for w in matched_words[:3]])
            explanations.append(f"Matched keywords: {matched_formatted}")
        else:
            explanations.append("Matched via semantic vector similarity")

    # 2. Metadata Filter Constraint Explanations
    if structured_query and hasattr(structured_query, "filter") and structured_query.filter:
        filter_node = structured_query.filter
        comparisons = []

        def extract_comparisons(node):
            if hasattr(node, "arguments"):
                for arg in node.arguments:
                    extract_comparisons(arg)
            elif hasattr(node, "attribute") and hasattr(node, "comparator"):
                comparisons.append(node)

        extract_comparisons(filter_node)

        for comp in comparisons:
            attr = str(comp.attribute).lower()
            val = comp.value
            comp_type = str(getattr(comp.comparator, "value", comp.comparator)).lower()

            if attr == "price" and "price" in metadata and metadata["price"] is not None:
                item_price = metadata["price"]
                try:
                    num_val = float(val)
                    if comp_type in ["lt", "<", "lte", "<="]:
                        explanations.append(
                            f"Price ₹{int(item_price):,} satisfies filter (< ₹{int(num_val):,})"
                        )
                    elif comp_type in ["gt", ">", "gte", ">="]:
                        explanations.append(
                            f"Price ₹{int(item_price):,} satisfies filter (> ₹{int(num_val):,})"
                        )
                    elif comp_type in ["eq", "==", "="]:
                        explanations.append(f"Price ₹{int(item_price):,} satisfies filter")
                except (ValueError, TypeError):
                    explanations.append(f"Price ₹{int(item_price):,} matches price rule")

            elif (
                attr == "rating"
                and "rating" in metadata
                and metadata["rating"] is not None
            ):
                item_rating = metadata["rating"]
                try:
                    num_val = float(val)
                    if comp_type in ["gt", ">", "gte", ">="]:
                        explanations.append(
                            f"Rating {item_rating:.1f}★ satisfies filter (> {num_val:.1f}★)"
                        )
                    elif comp_type in ["lt", "<", "lte", "<="]:
                        explanations.append(
                            f"Rating {item_rating:.1f}★ satisfies filter (< {num_val:.1f}★)"
                        )
                    elif comp_type in ["eq", "==", "="]:
                        explanations.append(
                            f"Rating {item_rating:.1f}★ satisfies rating filter"
                        )
                except (ValueError, TypeError):
                    explanations.append(f"Rating {item_rating:.1f}★ matches rating rule")

            elif attr == "category" and "category" in metadata:
                explanations.append(
                    f'Category "{metadata["category"]}" matches requested category'
                )

    return " • ".join(explanations)
