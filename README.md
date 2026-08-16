<div align="center">

# SmartFind — AI-Powered Product Search Engine

**Constraint-Aware Hybrid E-Commerce Search using LangChain SelfQueryRetriever, Google Gemini, and Pinecone Vector Database.**

<p align="center">
  <img src="https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Pinecone_DB-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="HuggingFace" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

</div>

---

## 📑 Table of Contents

- [📌 Overview](#-overview)
- [🛑 Problem Statement: The Limits of Pure Vector Search](#-problem-statement-the-limits-of-pure-vector-search)
- [💡 Solution: Semantic Search + Structured Filtering](#-solution-semantic-search--structured-metadata-filtering)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture & Search Flow](#️-architecture--search-flow)
- [🛠️ Technology Stack](#️-technology-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [📊 Dataset & Preprocessing](#-dataset--preprocessing)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation & Local Setup](#️-installation--local-setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [🚀 Production Deployment (Vercel + Render)](#-production-deployment-vercel--render)
  - [Part 1: Deploy Backend on Render](#part-1-deploy-backend-on-render)
  - [Part 2: Deploy Frontend on Vercel](#part-2-deploy-frontend-on-vercel)
- [📡 API Documentation](#-api-documentation)
- [🧪 Example Natural-Language Queries](#-example-natural-language-queries)
- [🧠 Design Decisions & Engineering Tradeoffs](#-design-decisions--engineering-tradeoffs)
- [🔒 Security Best Practices](#-security-best-practices)
- [🔮 Future Improvements](#-future-improvements)

---

## 📌 Overview

**SmartFind** is a production-grade, constraint-aware search engine designed for modern e-commerce catalogs. Traditional e-commerce search engines rely on keyword matching (which fails on synonyms and semantic intent) or pure vector similarity search (which fails on strict numerical bounds like _"under ₹1,500"_ or _"rating above 4.2"_).

SmartFind bridges this gap using **Self-Querying Retrieval**: an LLM dynamically decomposes natural-language queries into a clean semantic search query and structured metadata filters (`price`, `rating`, `category`), executing single-pass filtered vector search over 250,000+ products in Pinecone Cloud.

---

## 🛑 Problem Statement: The Limits of Pure Vector Search

Standard Dense Vector Retrieval (RAG / Embeddings) computes cosine similarity between query embeddings and item descriptions. However, vector distance cannot reliably enforce logical constraints:

1. **Numerical Imprecision**: An embedding model does not know that `₹1,499` is strictly less than `₹1,500`, while `₹1,599` is not. A pure vector query for _"laptop under 40000"_ often returns a ₹65,000 laptop because the textual semantics are nearly identical.
2. **Hard vs. Soft Filters**: Users expect strict compliance with constraints (e.g., _"4+ star rating only"_). Pure vector search treats these as soft preferences, polluting top results with irrelevant products.
3. **Keyword Search Brittle Syntax**: Traditional SQL/NoSQL filtering requires complex UI dropdowns and facet forms, degrading mobile user experience and failing on conversational search.

---

## 💡 Solution: Semantic Search + Structured Metadata Filtering

SmartFind implements LangChain's **`SelfQueryRetriever`** paired with **Google Gemini**:

1. **Natural Language Understanding**: An LLM parses unstructured user queries (e.g., _"running shoes under 2500 with rating above 4.2"_) into an Abstract Syntax Tree (`StructuredQuery`).
2. **Query Decomposition**:
   - **Semantic Search Term**: `"running shoes"` (passed to the local embedding model).
   - **Structured Filters**: `and(price < 2500, rating > 4.2)` (translated into Pinecone metadata query syntax).
3. **Single-Pass Execution**: Pinecone evaluates the vector similarity strictly across items that satisfy the boolean metadata filter.
4. **Deterministic Match Explainability**: The backend reconstructs how each product satisfied both the semantic meaning and numerical constraints.

---

## ✨ Key Features

- **Natural-Language Constraint Extraction**: Automatically extracts price limits, rating thresholds, and product categories from conversational user queries.
- **Single-Pass Filtered Vector Retrieval**: Executes single-pass search combining dense vector similarity with boolean metadata filters in Pinecone Cloud.
- **Search Explainability ("💡 Why this matched")**: Generates clear, human-readable explanations showing the exact semantic terms and satisfied filter thresholds for every result.
- **Local Zero-Cost Embedding Pipeline**: Generates 384-dim dense vectors locally on CPU using `all-MiniLM-L6-v2` with zero API costs and rate limits.
- **Production Catalog Scale**: Efficiently handles 258,000+ indexed products with deterministic MD5 deduplication and responsive 48-item pagination.

---

## 🏗️ Architecture & Search Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React as React Frontend (Vite on Vercel)
    participant FastAPI as FastAPI Backend (Render)
    participant Gemini as Google Gemini (3.5 Flash)
    participant Embed as Local HuggingFace (MiniLM-L6-v2)
    participant Pinecone as Pinecone Vector DB
    participant Lookup as In-Memory Metadata Lookup

    User->>React: Enters query ("headphones under ₹1500 with rating above 4")
    React->>FastAPI: POST /search { query, top_k: 500 }

    rect rgb(240, 244, 255)
        note over FastAPI,Gemini: 1. Self-Query Query Decomposition
        FastAPI->>Gemini: Query + AttributeInfo Schema
        Gemini-->>FastAPI: StructuredQuery(query="headphones", filter=AND(price<1500, rating>4.0))
    end

    rect rgb(245, 255, 245)
        note over FastAPI,Pinecone: 2. Filtered Vector Retrieval
        FastAPI->>Embed: Embed query string ("headphones")
        Embed-->>FastAPI: 384-dimensional dense vector
        FastAPI->>Pinecone: query(vector, filter={price: {$lt: 1500}, rating: {$gt: 4.0}}, top_k=500)
        Pinecone-->>FastAPI: Top matching document vectors + metadata
    end

    rect rgb(255, 250, 240)
        note over FastAPI,Lookup: 3. Enrichment & Explainability
        FastAPI->>Lookup: Enrich images, discount prices, review counts
        FastAPI->>FastAPI: Generate "Why this matched" explanation
    end

    FastAPI-->>React: JSON Response (results, explanation, metadata)
    React->>User: Renders 4-column grid, active filter chips, and pagination
```

---

## 🛠️ Technology Stack

### **Backend**

- **Framework**: FastAPI (Python 3.10+)
- **Orchestration**: LangChain (`SelfQueryRetriever`, `PineconeTranslator`)
- **LLM**: Google Gemini (`gemini-3.5-flash-lite` via `langchain-google-genai`)
- **Vector Database**: Pinecone Cloud Serverless (`cosine` metric, 384 dimensions)
- **Embedding Model**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (Local CPU / PyTorch)
- **Deployment**: Render.com (Web Service / Persistent Python runtime)
- **Data Processing**: Pandas & PyArrow

### **Frontend**

- **Framework**: React 18
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Deployment**: Vercel (Global Edge Network)
- **Typography**: Outfit & Inter (Google Fonts)
- **Styling**: Modern CSS Design System (Custom tokens, responsive grid, zero heavy UI frameworks)

---

## 📊 Dataset & Preprocessing

The underlying catalog is derived from large-scale Amazon e-commerce product archives containing 140 department categories.

### **Preprocessing Pipeline (`backend/src/preprocessing.py`)**

1. **Price Normalization**: Cleans currency strings, strips symbols (`₹`, `,`), and extracts numeric floats in INR (falls back from `discount_price` to `actual_price`).
2. **Rating Validation**: Converts rating strings (`0.0` to `5.0`) to numeric floats, dropping unrated/null entries.
3. **Search Content Formatting**: Concatenates `name` and `sub_category` into descriptive search texts.
4. **Deduplication**: Eliminates cross-category duplicate listings using unique product titles.
5. **Final Clean Catalog**: **258,911 distinct products** saved to `backend/data/metadata.parquet` (16.4 MB compressed metadata file included in repository) and `backend/data/amazon_preprocessed.csv`.

---

## 📂 Project Structure

```text
SmartFind/
├── backend/
│   ├── data/
│   │   ├── metadata.parquet           # Lightweight compressed metadata (images, prices, ratings)
│   │   └── amazon.csv                 # Master dataset (local / raw)
│   ├── models/
│   │   └── all-MiniLM-L6-v2/          # Local HuggingFace embedding weights (384-dim)
│   ├── scripts/
│   │   └── run_batch_indexing.py      # Idempotent Pinecone vector batch uploader
│   ├── src/
│   │   ├── __init__.py
│   │   ├── app.py                     # FastAPI application & /search endpoint
│   │   ├── explainer.py               # AST explainability reasoning generator
│   │   ├── retriever.py               # SelfQueryRetriever + Gemini configuration
│   │   ├── schema.py                  # SelfQuery metadata attribute definitions
│   │   ├── document_loader.py         # DataFrame to LangChain Document converter
│   │   ├── preprocessing.py           # Data cleaning & currency normalization
│   │   └── vectorstore.py             # Pinecone VectorStore initialization & connection
│   ├── requirements.txt               # Python package dependencies
│   └── .env.example                   # Backend environment template
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmptyState.jsx         # Zero-results suggestion UI
│   │   │   ├── ErrorState.jsx         # Graceful error banner with retry
│   │   │   ├── Explanation.jsx        # "Why this matched" collapsible accordion
│   │   │   ├── FilterChips.jsx        # Active constraint chips
│   │   │   ├── Header.jsx             # Branding & AI badge
│   │   │   ├── LoadingState.jsx       # Non-freezing skeleton loaders
│   │   │   ├── Pagination.jsx         # 48 items/page numbered navigation
│   │   │   ├── ProductCard.jsx        # Product display card with image fallback
│   │   │   ├── ResultsHeader.jsx      # Query context & product counter
│   │   │   └── SearchBar.jsx          # Input, suggestions & clear button
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css                  # Design system tokens & 4-col responsive grid
│   │   └── ProductSearch.jsx          # Main container component
│   ├── index.html                     # HTML shell with no-referrer policy
│   ├── package.json
│   ├── vercel.json                    # Vercel deployment configuration
│   ├── .env.example                   # Frontend environment template
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Local Setup

### **Prerequisites**

- Python 3.10+
- Node.js 18+ and npm
- Pinecone Cloud API Key
- Google Gemini API Key

---

### **1. Backend Setup**

```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### **Configure Environment Variables (`backend/.env`)**

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=ecommerce-products
```

#### **(Optional) Index the Vector Database**

To index the 258,911 preprocessed products into Pinecone:

```powershell
python scripts/run_batch_indexing.py full
```

#### **Run FastAPI Backend**

```powershell
python -m uvicorn src.app:app --host 0.0.0.0 --port 8000
```

- **API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### **2. Frontend Setup**

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- **Web Application**: [http://localhost:5173/](http://localhost:5173/)

---

## 🚀 Production Deployment (Vercel + Render)

```
┌─────────────────────────┐          HTTPS (JSON)          ┌───────────────────────────────────┐
│     Vercel Edge CDN     │ ─────────────────────────────> │            Render.com             │
│  React 18 + Vite (SPA)  │ <───────────────────────────── │       FastAPI Python Backend      │
└─────────────────────────┘                                └───────────────────────────────────┘
```

---

### **Part 1: Deploy Backend on Render**

1. Go to **[https://render.com/](https://render.com/)** and log in with GitHub.
2. Click **New +** ➔ **Web Service** ➔ connect your **`SmartFind`** repository.
3. Configure the service:
   - **Name**: `smartfind-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.app:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `PINECONE_API_KEY`: Your Pinecone API Key
   - `PINECONE_INDEX_NAME`: `ecommerce-products`
5. Click **"Create Web Service"**.
6. Copy your public service URL (e.g. `https://smartfind-backend.onrender.com`).

---

### **Part 2: Deploy Frontend on Vercel**

1. Push your repository to **GitHub**.
2. Go to **[https://vercel.com/](https://vercel.com/)** ➔ click **Add New...** ➔ **Project** ➔ import your repository.
3. In Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** ➔ select `frontend`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://smartfind-backend.onrender.com` *(your Render backend URL)*
5. Click **Deploy**.

---

## 📡 API Documentation

### **Endpoint: `POST /search`**

Executes conversational self-querying search with structured metadata filtering.

#### **Request Format**

```json
{
  "query": "headphones under 1500 with rating above 4",
  "top_k": 500
}
```

#### **Response Format**

```json
{
  "query": "headphones under 1500 with rating above 4",
  "count": 500,
  "results": [
    {
      "page_content": "boAt Rockerz 450 Bluetooth On Ear Headphones with Mic - Headphones",
      "metadata": {
        "price": 1499.0,
        "rating": 4.2,
        "category": "All Electronics",
        "image": "https://m.media-amazon.com/images/I/61u1VALn6JL._AC_UL320_.jpg",
        "no_of_ratings": "125,430",
        "actual_price": "₹3,990",
        "discount_price": "₹1,499"
      },
      "explanation": "Matched 'headphones' via semantic similarity • Price ₹1,499 satisfies filter (< ₹1,500) • Rating 4.2★ satisfies filter (> 4.0★)"
    }
  ]
}
```

---

## 🧪 Example Natural-Language Queries

| Query Type               | Natural Language Input                      | Extracted Semantic Term | Extracted Metadata Filter                           |
| :----------------------- | :------------------------------------------ | :---------------------- | :-------------------------------------------------- |
| **Price Constraint**     | `"headphones under ₹2000"`                  | `"headphones"`          | `price < 2000`                                      |
| **Rating Threshold**     | `"running shoes rating above 4.3"`          | `"running shoes"`       | `rating > 4.3`                                      |
| **Combined Filters**     | `"phones under 20000 with rating above 4"`  | `"phones"`              | `and(price < 20000, rating > 4.0)`                  |
| **Category Constraint**  | `"laptops under 40000 in electronics"`      | `"laptops"`             | `and(price < 40000, category == 'All Electronics')` |
| **Complex Multi-Clause** | `"split AC 1.5 ton under 35000 rating > 4"` | `"split AC 1.5 ton"`    | `and(price < 35000, rating > 4.0)`                  |

---

## 🧠 Design Decisions & Engineering Tradeoffs

1. **Self-Querying vs. Separate Filter UI**:
   - _Decision_: Extract constraints via LLM directly from the search bar instead of forcing users to configure manual sidebar facets.
   - _Tradeoff_: Requires ~1.1s LLM parsing latency, but delivers a seamless unified conversational search experience.
2. **Local Embedding Model vs. Cloud API Embeddings**:
   - _Decision_: Use local `all-MiniLM-L6-v2` via PyTorch CPU multi-threading instead of OpenAI/Cohere embedding APIs.
   - _Benefit_: Zero embedding API costs, zero rate limits, and 100% offline data indexing capability.
3. **Idempotent Deterministic Vector IDs**:
   - _Decision_: Hash `(text, category, price)` into MD5 vector IDs during Pinecone upserting.
   - _Benefit_: Re-indexing or updating datasets never inflates vector counts or creates duplicate search results.

---

## 🔒 Security Best Practices

- **API Key Isolation**: Sensitive keys (`PINECONE_API_KEY`, `GEMINI_API_KEY`) reside exclusively in backend environment variables and are never exposed to the client bundle.
- **CORS Whitelisting**: FastAPI backend restricts cross-origin resource sharing to trusted local and deployment origins.
- **Referrer Protection**: Frontend uses `<meta name="referrer" content="no-referrer">` to protect user privacy and prevent CDN image blocking.
- **Error Masking**: Internal tracebacks and database errors are caught and masked with friendly error states in production endpoints.

---

## 🔮 Future Improvements

- [ ] **Multi-Vector Hybrid Keyword Fusion (BM25 + Dense)**: Implement hybrid reciprocal rank fusion (RRF) combining sparse BM25 lexical scores with Pinecone dense embeddings.
- [ ] **User Personalization & Session Memory**: Integrate conversational memory to allow multi-turn query refinement (e.g., _"show me cheaper ones"_).
- [ ] **Semantic Caching**: Deploy Redis semantic vector caching to serve repeat queries in sub-50ms without invoking the LLM.
