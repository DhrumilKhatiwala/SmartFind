from typing import List, Dict, Any


def map_category_synonym(cat_val: Any) -> Any:
    """
    Normalizes human-language category query synonyms to the exact indexed
    department names in the Pinecone dataset.
    """
    if not isinstance(cat_val, str):
        return cat_val
    c = cat_val.strip().lower()
    if c in [
        "electronics",
        "all electronics",
        "laptop",
        "laptops",
        "computer",
        "computers",
        "phone",
        "phones",
        "audio",
        "headphone",
        "headphones",
        "camera",
        "cameras",
        "tv",
        "tvs",
        "gadgets",
    ]:
        return "tv, audio & cameras"
    if c in [
        "appliance",
        "appliances",
        "kitchen appliances",
        "air fryer",
        "ac",
        "refrigerator",
        "washing machine",
        "microwave",
    ]:
        return "appliances"
    if c in ["home", "kitchen", "home & kitchen", "cookware"]:
        return "home & kitchen"
    if c in ["beauty", "health", "beauty & health", "personal care"]:
        return "beauty & health"
    if c in ["sports", "fitness", "sports & fitness", "gym"]:
        return "sports & fitness"
    if c in ["shoes", "shoe", "footwear", "sneakers", "running shoes"]:
        return "men's shoes"
    if c in ["clothing", "clothes", "fashion", "apparel", "shirts"]:
        return "men's clothing"
    return cat_val


def sanitize_pinecone_filter(filter_obj: Any) -> Any:
    """
    Recursively sanitizes Pinecone metadata filter dictionaries to ensure:
    - Numeric fields ('price', 'rating') are strictly converted to float/int, not strings.
    - Category fields are mapped to exact indexed Pinecone department names.
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
        elif key == "category":
            if isinstance(value, dict):
                inner = {}
                for op, op_val in value.items():
                    inner[op] = map_category_synonym(op_val)
                sanitized[key] = inner
            else:
                sanitized[key] = map_category_synonym(value)
        elif key in ("$and", "$or") and isinstance(value, list):
            sanitized[key] = [sanitize_pinecone_filter(item) for item in value if item]
        else:
            sanitized[key] = (
                sanitize_pinecone_filter(value) if isinstance(value, dict) else value
            )
    return sanitized


def format_ast_constraints(structured_query: Any) -> List[str]:
    """
    Extracts clean, structured human-readable constraint labels directly
    from the LangChain StructuredQuery AST.
    """
    if not structured_query or not hasattr(structured_query, "filter"):
        return []
    filter_node = structured_query.filter
    if not filter_node:
        return []

    comparisons = []

    def extract_comparisons(node):
        if hasattr(node, "arguments"):
            for arg in node.arguments:
                extract_comparisons(arg)
        elif hasattr(node, "attribute") and hasattr(node, "comparator"):
            comparisons.append(node)

    extract_comparisons(filter_node)

    labels = []
    for comp in comparisons:
        attr = str(comp.attribute).lower()
        comp_type = str(getattr(comp.comparator, "value", comp.comparator)).lower()
        val = comp.value

        if attr == "price":
            try:
                num_val = int(float(val))
                val_str = f"₹{num_val:,}"
            except Exception:
                val_str = f"₹{val}"

            if comp_type in ["lt", "<", "lte", "<="]:
                labels.append(f"Under {val_str}")
            elif comp_type in ["gt", ">", "gte", ">="]:
                labels.append(f"Above {val_str}")
            elif comp_type in ["eq", "==", "="]:
                labels.append(f"Price = {val_str}")
            else:
                labels.append(f"Price {comp_type} {val_str}")

        elif attr == "rating":
            try:
                r_val = float(val)
                val_str = f"{r_val:.1f}★" if r_val != int(r_val) else f"{int(r_val)}★"
            except Exception:
                val_str = f"{val}★"

            if comp_type in ["gt", ">", "gte", ">="]:
                labels.append(f"Rating > {val_str}")
            elif comp_type in ["lt", "<", "lte", "<="]:
                labels.append(f"Rating < {val_str}")
            elif comp_type in ["eq", "==", "="]:
                labels.append(f"Rating = {val_str}")
            else:
                labels.append(f"Rating {comp_type} {val_str}")

        elif attr in ["category", "sub_category"]:
            labels.append(f"Category: {val}")
        else:
            labels.append(f"{attr.capitalize()}: {val}")

    return labels
