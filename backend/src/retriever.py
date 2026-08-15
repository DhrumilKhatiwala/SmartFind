import os
import sys
from typing import List
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI
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
    model_name: str = "gemini-3.5-flash-lite",
    temperature: float = 0.0,
    search_k: int = 10,
) -> SelfQueryRetriever:



    """
    Initializes a LangChain SelfQueryRetriever configured with:
    - ChatGoogleGenerativeAI (Gemini 2.5 Flash) for constructing structured filters from natural language.
    - Pinecone Cloud Vector Store containing product embeddings.
    - PineconeTranslator for translating structured queries into Pinecone filters.
    - AttributeInfo metadata schema (price, rating, category).
    - document_content_description summary string.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not configured. Please set your key in the .env file."
        )

    # 1. Initialize latest Gemini LLM (gemini-2.5-flash) for structured query parsing
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=api_key,
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
    # Natural language query: "phones under 20000 with rating above 4"
    # Converts to:
    #   Semantic Query  -> "phones"
    #   Metadata Filter -> price < 20000 AND rating > 4
    test_query = "headphones under ₹2000"
    print(f"Executing query: '{test_query}'...")

    retriever = initialize_self_query_retriever()
    results: List[Document] = retriever.invoke(test_query)

    print(f"\nRetrieved {len(results)} filtered document(s):")
    for i, doc in enumerate(results, start=1):
        print(f"\n[{i}] {doc.page_content}")
        print(f"    Metadata: {doc.metadata}")
