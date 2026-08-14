import os
import sys
import time
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

from src.retriever import initialize_self_query_retriever

retriever = initialize_self_query_retriever(model_name="gemini-2.0-flash")
vectorstore = retriever.vectorstore


query = "phones under 20000 with rating above 4"

print(f"Benchmarking query: '{query}'")

t0 = time.time()
# SINGLE-PASS FAST EXECUTION:
# 1. LLM call (only ONCE!)
sq = retriever.query_constructor.invoke({"query": query})
t_llm = time.time() - t0

# 2. Vector search directly with translated filter
t1 = time.time()
semantic_query, search_kwargs = retriever.structured_query_translator.visit_structured_query(sq)
pinecone_filter = search_kwargs.get("filter") if search_kwargs else None
docs = vectorstore.similarity_search(semantic_query, k=5, filter=pinecone_filter)
t_search = time.time() - t1

print(f"⚡ LLM Filter Parse Time: {t_llm:.2f}s")
print(f"⚡ Pinecone Vector Search Time: {t_search:.2f}s")
print(f"🚀 Total Single-Pass Search Time: {time.time() - t0:.2f}s")
print(f"Parsed query: '{semantic_query}' | Filter: {pinecone_filter}")
print(f"Results retrieved: {len(docs)}")
