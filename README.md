<div align="center">

# SmartFind: AI-Powered Product Search Engine

[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Self--Query-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Groq](https://img.shields.io/badge/Groq-Fast_Inference-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/)

_Natural-language e-commerce search with automatic budget, rating, and category filtering._

<br />

<img src="docs/demo.webp" width="100%" alt="SmartFind Interactive Demo" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

<br />

</div>

---

## 📑 Table of Contents

- [📌 What is SmartFind?](#-what-is-smartfind)
- [💡 Why I Built It](#-why-i-built-it)
- [⚙️ How It Works](#️-how-it-works)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📊 Dataset](#-dataset)
- [📈 Evaluation](#-evaluation)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔍 Example Queries](#-example-queries)
- [🎯 Why This Project?](#-why-this-project)
- [⚠️ Limitations](#️-limitations)
- [🔮 Future Improvements](#-future-improvements)

---

## 📌 What is SmartFind?

SmartFind is an e-commerce search engine that lets users search for products using plain, everyday language while automatically applying strict budget, rating, and category requirements.

When shopping online, people rarely search using just single keywords. Instead, they search with natural sentences like _"wireless headphones under ₹1,500 with rating above 4 stars"_.

SmartFind uses an LLM to separate the user's intent into two parts: **what the product is** (semantic search) and **what rules it must follow** (price ceilings, minimum ratings, and departments). It searches over 258,000 products and only returns items that match both the concept and the exact numbers.

---

## 💡 Why I Built It

Traditional search systems and basic vector search engines struggle with natural shopping queries:

- **Keyword Search** fails when users use synonyms or conversational phrases (e.g., searching _"budget gym shoes"_ might miss items titled _"athletic running sneakers"_).
- **Basic Vector Search** understands meaning, but it cannot do math. Because embeddings only measure text similarity, a vector search for _"headphones under ₹1,500"_ often returns ₹14,000 studio headphones simply because the text description looks similar.

### Example:

> **Search Query:** _"Headphones under ₹1,500 with rating above 4"_
>
> - **Normal Vector Search:** Returns top-rated ₹8,000 headphones because they are high quality and match the word "headphones" (violates the ₹1,500 budget).
> - **SmartFind:** Searches for "headphones", but strictly filters the database so only items with `price <= 1500` and `rating >= 4.0` can ever be returned.

---

## ⚙️ How It Works

```mermaid
flowchart LR
    A["User Query\n'headphones under ₹1500'"] --> B["LLM Query Parser\n(Groq Cloud)"]
    B --> C["Structured Search\nQuery: 'headphones'\nFilter: price <= 1500"]
    C --> D["Pinecone Vector Database\n(Single-Pass Filtered Search)"]
    D --> E["FastAPI Backend\n(Metadata Enrichment)"]
    E --> F["React Frontend\n(Cards + 'Why this matched')"]
```

1. **User Query**: The user types a natural-language search into the search bar.
2. **Query Understanding**: Groq Cloud (`openai/gpt-oss-120b`) parses the sentence in ~150ms and separates the product keywords from numeric constraints (e.g., `price <= 1500`, `rating >= 4.0`).
3. **Filtered Vector Search**: Pinecone runs a vector search on the product meaning while applying the filters directly on the database nodes.
4. **Enrichment & Formatting**: FastAPI retrieves product images, discounts, and ratings from the local dataset.
5. **Results & Explanation**: The frontend displays product cards along with a clear explanation of why each product matched the query.

---

## ✨ Features

- **Natural-Language Search**: Search for products using conversational sentences.
- **Price and Rating Constraints**: Automatically filters items by price limits and minimum star ratings.
- **Category Filtering**: Recognizes product departments (e.g., Electronics, Footwear, Home & Kitchen).
- **Semantic Vector Search**: Finds relevant items even if the exact keyword is not in the title.
- **Explainable Results**: Each product card explains how it satisfied the search query and filters.
- **Responsive Web Interface**: Clean, mobile-friendly React frontend with suggestion chips and pagination (48 items per page).
- **Production API**: Lightweight FastAPI backend with interactive Swagger documentation (`/docs`) and health checks.

---

## 🛠️ Tech Stack

| Technology            | Purpose                                                                            |
| :-------------------- | :--------------------------------------------------------------------------------- |
| **React 18 & Vite**   | Frontend user interface and responsive styling                                     |
| **FastAPI & Uvicorn** | High-performance Python backend REST API                                           |
| **LangChain**         | Self-querying retrieval orchestration and AST filter translation                   |
| **Groq Cloud**        | High-speed query parsing and constraint extraction (`openai/gpt-oss-120b`, ~150ms) |
| **Pinecone Cloud**    | Serverless vector database for vector similarity search                            |
| **FastEmbed (ONNX)**  | Lightweight CPU embedding engine (`all-MiniLM-L6-v2`, 384 dimensions)              |
| **PyArrow & Parquet** | Fast on-disk product metadata lookups with minimal memory usage                    |

---

## 📊 Dataset

SmartFind is tested on a dataset of **258,911 real-world Amazon India products**:

- **Stored in Pinecone**: 384-dimensional dense vectors generated from product titles and categories, along with numerical metadata fields (`price`, `rating`, `category`).
- **Stored on Disk (`metadata.parquet`)**: Complete product catalog information including product images, discount percentages, review counts, and actual retail prices.
- **Lookups**: The backend uses PyArrow to stream metadata from disk during search requests in ~15ms without loading the entire 258k rows into RAM.

---

## 📈 Evaluation

To verify whether constraint-aware retrieval actually performs better than standard vector search, we built an automated benchmark module in `evaluation/` and tested **60 realistic shopping queries** against the entire 258,911 product catalog in Pinecone.

### Benchmark Results ($K=5$)

| Metric                           | Baseline Vector Search | SmartFind (Self-Query) |      Difference      |
| :------------------------------- | :--------------------: | :--------------------: | :------------------: |
| **Constraint Satisfaction Rate** |         30.0%          |       **100.0%**       |    **+70.0% pts**    |
| **Query Success Rate**           |          8.3%          |       **100.0%**       |    **+91.7% pts**    |
| **Precision @ 3**                |         29.4%          |       **100.0%**       |    **+70.6% pts**    |
| **Precision @ 5**                |         30.0%          |       **100.0%**       |    **+70.0% pts**    |
| **Average Latency**              |      **378.7 ms**      |       2,033.0 ms       | +1.65s (LLM parsing) |

<div align="center">
  <img src="evaluation/benchmark_comparison.png" alt="SmartFind Evaluation Benchmark Chart" width="750px" />
</div>

### What These Numbers Mean:

- **Constraint Satisfaction (30.0% → 100.0%)**: In baseline vector search, 70% of returned items broke the user's price or rating rules. SmartFind ensures 100% of returned products respect every constraint.
- **Query Success Rate (8.3% → 100.0%)**: Only 8.3% of queries in baseline search returned a completely clean page of results. SmartFind returned 100% compliant pages across all 60 test queries.

---

## 📂 Project Structure

```text
SmartFind/
├── backend/
│   ├── src/
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py              # Pydantic models (SearchRequest, DocumentResult, SearchResponse)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── reranker.py             # Product-Anchor Re-ranking engine (hardware boost & accessory penalty)
│   │   │   ├── filters.py              # AST constraint formatter, category mapping & filter sanitizer
│   │   │   ├── explainer.py            # Structured explainability reasoning generation
│   │   │   └── metadata.py             # 0-RAM PyArrow Parquet disk scanner & metadata enrichment
│   │   ├── app.py                      # Streamlined FastAPI application entrypoint & cache
│   │   ├── retriever.py                # SelfQueryRetriever initialization with Groq (openai/gpt-oss-120b)
│   │   ├── schema.py                   # LangChain AttributeInfo metadata schema definitions
│   │   └── vectorstore.py              # Pinecone connection and FastEmbed ONNX embedding wrapper
│   ├── data/
│   │   └── metadata.parquet            # Compressed metadata for 258,911 products (0-RAM disk scanner)
│   ├── scripts/
│   │   └── run_batch_indexing.py       # Pinecone vector indexing script
│   ├── requirements.txt                # Backend dependencies (FastAPI, Pinecone, LangChain, Groq)
│   └── .env.example                    # Template for required environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QueryUnderstandingPanel.jsx # Extracted semantic intent, constraints & 4-step pipeline
│   │   │   ├── ResultsHeader.jsx       # Results count, active query context & client search latency
│   │   │   ├── ProductCard.jsx         # Card with constraint match indicator and rating badges
│   │   │   ├── Explanation.jsx         # Structured match reasoning breakdown tags
│   │   │   ├── SearchBar.jsx           # Input bar with categorized example query chips
│   │   │   ├── Pagination.jsx          # Responsive pagination controls (48 items/page)
│   │   │   ├── Header.jsx              # Clean application title and subtitle
│   │   │   ├── Footer.jsx              # Ultra-minimal unobtrusive footer
│   │   │   ├── Icons.jsx               # Professional SVG vector icons (Lucide / Heroicons style)
│   │   │   ├── LoadingState.jsx        # Skeleton loading placeholders
│   │   │   ├── EmptyState.jsx          # Zero results state with clickable suggestions
│   │   │   └── ErrorState.jsx          # Error handling banner with retry action
│   │   ├── ProductSearch.jsx           # Main search controller, AST insight handling & state
│   │   └── index.css                   # Responsive layout, grid styles & mobile typography
│   ├── index.html                      # HTML entry point with mobile viewport settings
│   └── package.json                    # Frontend dependencies (React 18, Vite)
├── evaluation/
│   ├── queries.json                    # 60 test queries with expected constraints
│   ├── metrics.py                      # Evaluation metrics (Constraint Satisfaction, Precision@K)
│   ├── evaluate.py                     # Automated benchmark runner comparing hybrid vs standard search
│   ├── generate_chart.py               # Benchmark comparison visualization generator
│   ├── benchmark_comparison.png        # Generated evaluation metrics chart
│   ├── results.json                    # Raw benchmark data output
│   └── report.md                       # Full technical benchmark report
├── render.yaml                         # Render cloud deployment blueprint
└── README.md                           # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Pinecone](https://www.pinecone.io/) account and API key
- A free [Groq Cloud](https://console.groq.com/) API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SmartFind.git
cd SmartFind
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=ecommerce-products
```

Run the backend server:

```bash
uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
```

API docs will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Running the Evaluation Benchmark

To run the 60-query benchmark locally:

```bash
python evaluation/evaluate.py
```

---

## 🔍 Example Queries

Try searching for queries like:

- `headphones under ₹1500 with rating above 4`
- `wireless earbuds under ₹2000`
- `laptops under ₹45000 in electronics`
- `running shoes under ₹2500 with rating above 4.2`
- `air fryer under ₹5000 with rating above 4`

---

## 🎯 Why This Project?

Most AI search tutorials stop at basic vector similarity. In real-world e-commerce, pure semantic search is not enough because users have hard constraints like budgets and minimum review scores.

SmartFind demonstrates how to combine **natural-language understanding** with **structured database filtering** to create search results that are both semantically relevant and mathematically accurate.

---

## ⚠️ Limitations

- **LLM Dependency**: Requires a live Groq API connection for natural-language query decomposition.
- **Static Dataset**: The current demonstration uses a static snapshot of Amazon products rather than a live inventory stream.

---

## 🔮 Future Improvements

- [ ] **Semantic Caching**: Cache common query decompositions in Redis to reduce search latency to under 50ms.
- [ ] **Hybrid Search**: Combine lexical BM25 keyword matching with dense vectors for brand code searches (e.g., exact model numbers).
- [ ] **Conversational Refinement**: Allow users to refine results across multiple chat turns (e.g., _"show me cheaper ones"_).

---
