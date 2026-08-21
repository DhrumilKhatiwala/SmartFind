# 📊 SmartFind Retrieval Evaluation & Benchmarking Module

This module provides a rigorous, automated benchmarking framework to evaluate the retrieval quality of **SmartFind** (*LangChain SelfQueryRetriever + Groq LLM + Pinecone Cloud Vector Store*) against **Baseline Dense Vector Search** (*semantic similarity without metadata filters*).

---

## 🎯 Benchmark Objectives

1. **Quantify the Constraint Failure Rate of Pure Vector Search**: Prove empirically why embedding models fail on numerical bounds (*price, rating*) and department categories.
2. **Measure SmartFind's Retrieval Precision**: Benchmark how accurately dynamic AST query decomposition with single-pass boolean vector filtering solves constraint compliance.
3. **Reproducible Information Retrieval Evaluation**: Provide standardized metrics (`Constraint Satisfaction Rate`, `Query Success Rate`, `Precision@K`) against a realistic test set.

---

## 📂 Module Architecture

```text
evaluation/
├── queries.json              # 60 curated natural-language product queries with ground-truth constraints
├── metrics.py                # Pure, deterministic metric computation functions
├── evaluate.py               # Main CLI evaluation runner executing both pipelines
├── generate_chart.py         # Matplotlib visualization generator
├── results.json              # Machine-readable JSON output of latest benchmark run
├── report.md                 # Detailed formatted Markdown evaluation report
├── benchmark_comparison.png  # High-resolution comparison bar chart (300 DPI)
└── README.md                 # Documentation and execution guide
```

---

## 📐 Metrics Formulations

### 1. **Constraint Satisfaction Rate (CSR)**
Measures the percentage of individual retrieved documents that strictly satisfy all numerical and categorical constraints across all queries:
$$\text{CSR} = \frac{\sum_{i=1}^{|Q|} \sum_{j=1}^{K} \mathbb{I}(\text{doc}_{i,j} \text{ satisfies all constraints})}{\text{Total retrieved documents across all queries}}$$

### 2. **Query Success Rate (QSR)**
Measures the proportion of queries where **100% of top-K retrieved results** satisfy all constraints (i.e. zero constraint-violating results shown to the user):
$$\text{QSR} = \frac{\text{Count of queries where all } K \text{ results satisfy constraints}}{|Q|}$$

### 3. **Precision@K ($K \in \{3, 5\}$)**
The average proportion of valid results within the top-$K$ returned items for each query:
$$\text{Precision@}K = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{\sum_{j=1}^{K} \mathbb{I}(\text{doc}_{i,j} \text{ satisfies all constraints})}{K}$$

---

## 🚀 Running the Benchmark

Ensure your virtual environment is activated and your `backend/.env` file contains your `GROQ_API_KEY` and `PINECONE_API_KEY`.

Run the evaluation script from the project root:

```powershell
python evaluation/evaluate.py
```

### **Output Artifacts Generated:**
1. **Console Summary Table**: Formatted benchmark comparison in your terminal.
2. **`evaluation/results.json`**: Complete machine-readable JSON metrics.
3. **`evaluation/report.md`**: Publication-ready Markdown summary with relative gains.
4. **`evaluation/benchmark_comparison.png`**: High-resolution comparison chart.
