import os
import sys
from typing import List, Optional
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from langchain_core.documents import Document
from langchain_groq import ChatGroq
from langchain_community.query_constructors.pinecone import PineconeTranslator

try:
    from langchain.retrievers.self_query.base import SelfQueryRetriever
except ImportError:
    from langchain_classic.retrievers.self_query.base import SelfQueryRetriever

from src.schema import document_content_description, metadata_field_info
from src.vectorstore import load_pinecone_vector_db

# Load environment configuration (.env)
load_dotenv()


def initialize_self_query_retriever(
    model_name: str = "openai/gpt-oss-120b",
    temperature: float = 0.0,
    search_k: int = 500,
) -> SelfQueryRetriever:
    """
    Initializes a LangChain SelfQueryRetriever configured with:
    - ChatGroq (openai/gpt-oss-120b) for ultra-fast query parsing (~150ms)
    - Pinecone Cloud Vector Store containing product embeddings
    - PineconeTranslator for translating structured queries into Pinecone boolean filters
    - AttributeInfo metadata schema (price, rating, category)
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        raise ValueError(
            "GROQ_API_KEY is not configured. Please set your key from https://console.groq.com/ in the .env file."
        )

    # 1. Initialize Groq LLM (openai/gpt-oss-120b) for fast structured query parsing
    llm = ChatGroq(
        model=model_name,
        temperature=temperature,
        groq_api_key=api_key,
    )

    # 2. Connect to existing Pinecone Cloud Vector Store
    vectorstore = load_pinecone_vector_db()

    # 3. Create SelfQueryRetriever with explicit PineconeTranslator
    retriever = SelfQueryRetriever.from_llm(
        llm=llm,
        vectorstore=vectorstore,
        document_contents=document_content_description,
        metadata_field_info=metadata_field_info,
        structured_query_translator=PineconeTranslator(),
        search_kwargs={"k": search_k},
        verbose=True,
    )

    return retriever


if __name__ == "__main__":
    test_query = "headphones under ₹2000 with rating above 4.0"
    print(f"Executing query: '{test_query}'...")

    retriever = initialize_self_query_retriever()
    results: List[Document] = retriever.invoke(test_query)

    print(f"\nRetrieved {len(results)} filtered document(s):")
    for i, doc in enumerate(results[:3], start=1):
        print(f"\n[{i}] {doc.page_content}")
        print(f"    Metadata: {doc.metadata}")
