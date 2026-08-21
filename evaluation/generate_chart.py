import json
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def generate_benchmark_chart(
    results_path: str = "evaluation/results.json",
    output_path: str = "evaluation/benchmark_comparison.png",
):
    """
    Generates a high-quality comparison chart for Vector Search vs SmartFind Self-Query.
    """
    if not os.path.exists(results_path):
        print(f"Error: {results_path} not found. Run evaluation first.")
        return

    with open(results_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    baseline = data.get("baseline_vector_search", {}).get("metrics", {})
    smartfind = data.get("smartfind_self_query", {}).get("metrics", {})

    metrics_labels = [
        "Constraint Satisfaction\n(K=5)",
        "Query Success Rate\n(K=5)",
        "Precision@3",
        "Precision@5",
    ]

    vector_search_scores = [
        baseline.get("constraint_satisfaction_rate_k5", 0.0),
        baseline.get("query_success_rate_k5", 0.0),
        baseline.get("precision_at_3", 0.0),
        baseline.get("precision_at_5", 0.0),
    ]

    smartfind_scores = [
        smartfind.get("constraint_satisfaction_rate_k5", 0.0),
        smartfind.get("query_success_rate_k5", 0.0),
        smartfind.get("precision_at_3", 0.0),
        smartfind.get("precision_at_5", 0.0),
    ]

    x = np.arange(len(metrics_labels))
    width = 0.35

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)

    color_baseline = "#94a3b8"  # Slate Gray
    color_smartfind = "#4f46e5"  # Indigo Violet

    rects1 = ax.bar(
        x - width / 2,
        vector_search_scores,
        width,
        label="Baseline Vector Search",
        color=color_baseline,
        edgecolor="#64748b",
        linewidth=1.2,
        alpha=0.9,
    )
    rects2 = ax.bar(
        x + width / 2,
        smartfind_scores,
        width,
        label="SmartFind (Self-Querying Retrieval)",
        color=color_smartfind,
        edgecolor="#3730a3",
        linewidth=1.2,
        alpha=0.95,
    )

    ax.set_ylabel("Score (%)", fontsize=12, fontweight="bold", color="#0f172a", labelpad=10)
    ax.set_title(
        "Information Retrieval Performance:\nBaseline Vector Search vs. SmartFind Constraint-Aware Retrieval",
        fontsize=14,
        fontweight="bold",
        color="#0f172a",
        pad=18,
    )
    ax.set_xticks(x)
    ax.set_xticklabels(metrics_labels, fontsize=11, fontweight="600", color="#1e293b")
    ax.set_ylim(0, 115)
    ax.legend(
        loc="upper left",
        fontsize=11,
        frameon=True,
        facecolor="#ffffff",
        edgecolor="#e2e8f0",
        framealpha=0.95,
    )

    # Attach value labels above bars
    def autolabel(rects, is_smartfind=False):
        for rect in rects:
            height = rect.get_height()
            color = "#3730a3" if is_smartfind else "#475569"
            ax.annotate(
                f"{height:.1f}%",
                xy=(rect.get_x() + rect.get_width() / 2, height),
                xytext=(0, 4),  # 4 points vertical offset
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=10.5,
                fontweight="bold",
                color=color,
            )

    autolabel(rects1, is_smartfind=False)
    autolabel(rects2, is_smartfind=True)

    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"Successfully generated comparison chart at: {output_path}")


if __name__ == "__main__":
    generate_benchmark_chart()
