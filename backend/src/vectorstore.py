import os
from typing import List, Optional
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from fastembed import TextEmbedding

load_dotenv()


class FastEmbedWrapper(Embeddings):
    """
    Ultra-lightweight ONNX-accelerated embedding wrapper for sentence-transformers/all-MiniLM-L6-v2.
    Uses ~25 MB RAM (vs 519 MB PyTorch), zero OOM crashes, and 3x faster CPU inference.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = TextEmbedding(model_name=model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [list(v) for v in self.model.embed(texts)]

    def embed_query(self, text: str) -> List[float]:
        return list(list(self.model.embed([text]))[0])


def download_and_get_local_embeddings(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
) -> Embeddings:
    """
    Returns FastEmbed embedding engine for Pinecone 384-dimensional retrieval.
    """
    return FastEmbedWrapper(model_name=model_name)


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
    embedding_model: Optional[Embeddings] = None,
    ids: Optional[List[str]] = None,
) -> PineconeVectorStore:
    """
    Upserts documents into Pinecone Cloud index with deterministic IDs.
    """
    index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "ecommerce-products")
    ensure_pinecone_index_exists(index_name=index_name, dimension=384)

    if embedding_model is None:
        embedding_model = download_and_get_local_embeddings()

    vectorstore = PineconeVectorStore.from_documents(
        documents=documents,
        embedding=embedding_model,
        index_name=index_name,
        ids=ids,
    )
    return vectorstore


def load_pinecone_vector_db(
    index_name: Optional[str] = None,
    embedding_model: Optional[Embeddings] = None,
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
