import os
from typing import List, Optional
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

load_dotenv()

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_MODEL_DIR = os.path.join(WORKSPACE_DIR, "models", "all-MiniLM-L6-v2")


def download_and_get_local_embeddings(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    local_dir: str = LOCAL_MODEL_DIR,
) -> HuggingFaceEmbeddings:
    """
    Downloads and loads local HuggingFace embedding model from models/ directory.
    """
    if not os.path.exists(local_dir):
        print(f"Downloading model '{model_name}' into workspace folder: {local_dir}...")
        os.makedirs(os.path.dirname(local_dir), exist_ok=True)
        model = SentenceTransformer(model_name)
        model.save(local_dir)
        print("Model successfully downloaded and saved locally.")

    return HuggingFaceEmbeddings(
        model_name=local_dir,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def ensure_pinecone_index_exists(
    index_name: str,
    dimension: int = 384,
    metric: str = "cosine",
    cloud: str = "aws",
    region: str = "us-east-1",
) -> Pinecone:
    """
    Ensures Pinecone index exists with 384 dimensions matching local embedding model.
    """
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key or api_key == "your_pinecone_api_key_here":
        raise ValueError("PINECONE_API_KEY is not configured in .env file.")

    pc = Pinecone(api_key=api_key)
    existing_names = [idx.name for idx in pc.list_indexes()]

    if index_name in existing_names:
        info = pc.describe_index(index_name)
        if info.dimension != dimension:
            print(f"Recreating Pinecone index '{index_name}' (dimension mismatch: {info.dimension} -> {dimension})...")
            pc.delete_index(index_name)
            existing_names.remove(index_name)

    if index_name not in existing_names:
        print(f"Creating serverless Pinecone index '{index_name}' (dimension={dimension}, metric={metric})...")
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(cloud=cloud, region=region),
        )
        print(f"Pinecone index '{index_name}' successfully created.")
    else:
        print(f"Found existing Pinecone index '{index_name}' (dimension={dimension}).")

    return pc


def store_documents_in_pinecone(
    documents: List[Document],
    index_name: Optional[str] = None,
    embedding_model: Optional[HuggingFaceEmbeddings] = None,
) -> PineconeVectorStore:
    """
    Upserts documents into Pinecone Cloud index.
    """
    index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "ecommerce-products")
    ensure_pinecone_index_exists(index_name=index_name, dimension=384)

    if embedding_model is None:
        embedding_model = download_and_get_local_embeddings()

    vectorstore = PineconeVectorStore.from_documents(
        documents=documents,
        embedding=embedding_model,
        index_name=index_name,
    )
    return vectorstore


def load_pinecone_vector_db(
    index_name: Optional[str] = None,
    embedding_model: Optional[HuggingFaceEmbeddings] = None,
) -> PineconeVectorStore:
    """
    Loads connected Pinecone Cloud Vector Store.
    """
    index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "ecommerce-products")

    if embedding_model is None:
        embedding_model = download_and_get_local_embeddings()

    return PineconeVectorStore(
        index_name=index_name,
        embedding=embedding_model,
    )
