import re
from typing import Any, Dict, List, Optional


def check_operator_condition(actual_val: Any, op: str, expected_val: Any) -> bool:
    """
    Evaluates whether actual_val satisfies expected_val according to op.
    Handles numeric comparison safely.
    """
    if actual_val is None or expected_val is None:
        return False

    try:
        if isinstance(actual_val, str):
            clean_str = re.sub(r"[^\d.]", "", actual_val)
            actual_num = float(clean_str) if clean_str else None
        else:
            actual_num = float(actual_val)
    except (ValueError, TypeError):
        actual_num = None

    try:
        expected_num = float(expected_val)
    except (ValueError, TypeError):
        expected_num = None

    if actual_num is not None and expected_num is not None:
        if op in ("<=", "le"):
            return actual_num <= expected_num
        elif op in ("<", "lt"):
            return actual_num < expected_num
        elif op in (">=", "ge"):
            return actual_num >= expected_num
        elif op in (">", "gt"):
            return actual_num > expected_num
        elif op in ("==", "eq", "="):
            return abs(actual_num - expected_num) < 1e-5

    # String equality fallback
    if op in ("==", "eq", "="):
        return str(actual_val).strip().lower() == str(expected_val).strip().lower()

    return False


def evaluate_document_constraints(
    doc_metadata: Dict[str, Any], expected_constraints: Dict[str, Any]
) -> bool:
    """
    Evaluates whether a single retrieved document's metadata satisfies ALL expected constraints.
    Returns True only if all present constraints are satisfied.
    """
    if not expected_constraints:
        return True

    if not doc_metadata:
        return False

    # 1. Price constraint check
    price_constraint = expected_constraints.get("price")
    if price_constraint:
        op = price_constraint.get("op", "<=")
        val = price_constraint.get("value")
        actual_price = doc_metadata.get("price")
        if actual_price is None:
            actual_price = doc_metadata.get("discount_price") or doc_metadata.get("actual_price")
        if not check_operator_condition(actual_price, op, val):
            return False

    # 2. Rating constraint check
    rating_constraint = expected_constraints.get("rating")
    if rating_constraint:
        op = rating_constraint.get("op", ">=")
        val = rating_constraint.get("value")
        actual_rating = doc_metadata.get("rating")
        if not check_operator_condition(actual_rating, op, val):
            return False

    # 3. Category constraint check
    cat_constraint = expected_constraints.get("category")
    if cat_constraint:
        val = cat_constraint.get("value") if isinstance(cat_constraint, dict) else cat_constraint
        if val:
            actual_cat = str(doc_metadata.get("category", "")).lower()
            expected_cat = str(val).lower()
            if expected_cat not in actual_cat and actual_cat not in expected_cat:
                return False

    return True


def compute_precision_at_k(
    retrieved_docs: List[Dict[str, Any]], expected_constraints: Dict[str, Any], k: int
) -> float:
    """
    Calculates Precision@K for a single query:
    Precision@K = (number of top-K results satisfying all constraints) / K
    """
    if k <= 0:
        return 0.0

    top_k_docs = retrieved_docs[:k]
    if not top_k_docs:
        return 0.0

    valid_count = sum(
        1
        for doc in top_k_docs
        if evaluate_document_constraints(doc.get("metadata", {}), expected_constraints)
    )

    return valid_count / float(k)


def compute_constraint_satisfaction_rate(
    all_query_results: List[List[Dict[str, Any]]],
    all_expected_constraints: List[Dict[str, Any]],
    k: Optional[int] = None,
) -> float:
    """
    Calculates the global Constraint Satisfaction Rate (CSR):
    CSR = (Total retrieved documents satisfying all constraints) / (Total retrieved documents)
    """
    total_docs = 0
    valid_docs = 0

    for results, constraints in zip(all_query_results, all_expected_constraints):
        docs_to_evaluate = results[:k] if k is not None else results
        for doc in docs_to_evaluate:
            total_docs += 1
            if evaluate_document_constraints(doc.get("metadata", {}), constraints):
                valid_docs += 1

    if total_docs == 0:
        return 0.0

    return (valid_docs / float(total_docs)) * 100.0


def compute_query_success_rate(
    all_query_results: List[List[Dict[str, Any]]],
    all_expected_constraints: List[Dict[str, Any]],
    k: int,
) -> float:
    """
    Calculates Query Success Rate (QSR):
    Percentage of queries where 100% of the returned top-K results satisfy all expected constraints.
    """
    if not all_query_results:
        return 0.0

    successful_queries = 0
    total_queries = len(all_query_results)

    for results, constraints in zip(all_query_results, all_expected_constraints):
        top_k = results[:k]
        if not top_k:
            continue

        all_valid = all(
            evaluate_document_constraints(doc.get("metadata", {}), constraints)
            for doc in top_k
        )
        if all_valid and len(top_k) > 0:
            successful_queries += 1

    return (successful_queries / float(total_queries)) * 100.0


def compute_benchmark_metrics(
    all_query_results: List[List[Dict[str, Any]]],
    all_expected_constraints: List[Dict[str, Any]],
    k_values: List[int] = [3, 5],
) -> Dict[str, Any]:
    """
    Computes all standard Information Retrieval evaluation metrics across the dataset.
    """
    metrics = {}

    for k in k_values:
        csr = compute_constraint_satisfaction_rate(
            all_query_results, all_expected_constraints, k=k
        )
        metrics[f"constraint_satisfaction_rate_k{k}"] = round(csr, 2)

        qsr = compute_query_success_rate(
            all_query_results, all_expected_constraints, k=k
        )
        metrics[f"query_success_rate_k{k}"] = round(qsr, 2)

        p_at_k_scores = [
            compute_precision_at_k(results, constraints, k=k)
            for results, constraints in zip(all_query_results, all_expected_constraints)
        ]
        mean_p_at_k = (sum(p_at_k_scores) / float(len(p_at_k_scores))) * 100.0 if p_at_k_scores else 0.0
        metrics[f"precision_at_{k}"] = round(mean_p_at_k, 2)

    return metrics
