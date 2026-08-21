# 📊 SmartFind Retrieval Evaluation Report

**Date**: 2026-08-19 21:04:18  
**Evaluated Queries**: 60 natural-language shopping queries  
**Dataset Scale**: 258,911 real-world Amazon e-commerce products  
**Vector Database**: Pinecone Cloud Serverless (384 dimensions, Cosine metric)  

---

## 🎯 Executive Summary

This empirical benchmark rigorously compares **Baseline Dense Vector Search** (*semantic similarity without metadata filters*) against **SmartFind Constraint-Aware Retrieval** (*LangChain SelfQueryRetriever + Google Gemini + Pinecone boolean metadata filtering*).

The evaluation proves that while pure vector search correctly captures semantic categories (e.g. returning headphones for a headphone query), **it frequently violates numerical price, rating, and categorical constraints**, returning expensive or low-rated products. **SmartFind resolves this with single-pass constraint filtering, boosting precision and query satisfaction.**

---

## 📈 Benchmark Performance Results

| Retrieval Metric | Baseline Vector Search | SmartFind (Self-Query) | Absolute Improvement | Relative Gain |
| :--- | :---: | :---: | :---: | :---: |
| **Constraint Satisfaction Rate (K=5)** | **30.0%** | **100.0%** | **+70.0% pts** | **+233.3%** |
| **Query Success Rate (K=5)** | **8.3%** | **100.0%** | **+91.7% pts** | **+1100.5%** |
| **Precision @ 3** | **29.4%** | **100.0%** | **+70.6% pts** | **+239.7%** |
| **Precision @ 5** | **30.0%** | **100.0%** | **+70.0% pts** | **+233.3%** |
| **Mean Retrieval Latency** | **378.7 ms** | **2033.0 ms** | +1654.3 ms (LLM parsing) | — |

---

## 🔍 Metric Definitions

1. **Constraint Satisfaction Rate (CSR)**: The percentage of individual retrieved products that strictly comply with all expected constraints (price ceiling, rating floor, category).
2. **Query Success Rate (QSR)**: The percentage of queries where **100% of the returned top-K results** satisfy all constraints (i.e. zero irrelevant or constraint-violating results in the user's view).
3. **Precision@K**: The average proportion of constraint-valid items within the top-$K$ returned products ($K=3, 5$).

---

## 📊 Visual Comparison

![Benchmark Comparison Chart](benchmark_comparison.png)

---

## 💡 Engineering Insights & Takeaways

1. **The Vector Search Dilemma**: Vector embeddings excel at fuzzy matching (*e.g., mapping "gym shoes" to "sneakers"*), but cannot perform numerical comparison. A ₹65,000 laptop has nearly identical text embedding to a ₹35,000 laptop.
2. **Self-Querying Eliminates Hallucinated Constraints**: Gemini 3.6 Flash dynamically constructs AST filter trees (`price <= 2000`, `rating >= 4.0`) that execute directly within Pinecone's serverless vector engine.
3. **Single-Pass Efficiency**: Rather than post-filtering after retrieval (which often results in zero returned items), Pinecone traverses the vector graph only across nodes satisfying the boolean filters.
