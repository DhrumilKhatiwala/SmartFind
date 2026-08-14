# QueryForge 🚀

**QueryForge** is a full-stack AI-powered e-commerce search platform featuring LangChain `SelfQueryRetriever`, Google Gemini API, Pinecone Cloud Vector Store, and FastAPI.

---

## 📁 Repository Structure

```text
QueryForge/
├── backend/                       # Python Backend (FastAPI, LangChain, Pinecone)
│   ├── .env                       # Backend API keys (GEMINI_API_KEY, PINECONE_API_KEY)
│   ├── requirements.txt           # Python dependency specifications
│   │
│   ├── src/                       # Core FastAPI & LangChain package
│   │   ├── __init__.py
│   │   ├── app.py                 # FastAPI application (GET /health, POST /search)
│   │   ├── retriever.py           # SelfQueryRetriever + Gemini 2.5 Flash
│   │   ├── vectorstore.py         # Pinecone Cloud Vector Store manager
│   │   ├── schema.py              # SelfQueryRetriever AttributeInfo definitions
│   │   ├── document_loader.py     # DataFrame to LangChain Document converter
│   │   └── preprocessing.py       # Data cleaning & currency parsing
│   │
│   ├── scripts/                   # CLI execution scripts
│   │   └── run_batch_indexing.py  # Fast local vectorization & Pinecone uploader
│   │
│   ├── data/                      # Cleaned e-commerce dataset
│   │   └── amazon_preprocessed.csv
│   │
│   └── models/                    # Local model weights
│       └── all-MiniLM-L6-v2/      # HuggingFace embedding weights (384-dim)
│
├── frontend/                      # React / Web Frontend Application
│
├── archive/                       # Source CSV archives (140 files)
├── .gitignore                     # Git exclusion rules
└── README.md                      # Project documentation
```

---

## ⚡ Quick Start: Backend

### 1. Install Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (`backend/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=ecommerce-products
```

### 3. Run FastAPI Backend Server

```powershell
cd backend
python -m src.app
```

- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Search Endpoint**: `POST http://localhost:8000/search`

---

## 🔍 SelfQueryRetriever Architecture

Natural language user queries are parsed by **Gemini 2.5 Flash** into structured search filters:

```text
User Query: "headphones under ₹2000"
   ↓
Semantic Query: "headphones"
Metadata Filter: price < 2000
   ↓
Pinecone Cloud: Returns top-k matching product documents & metadata
```
