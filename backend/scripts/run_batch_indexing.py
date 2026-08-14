import os
import sys
import time
from typing import Optional
import pandas as pd
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.document_loader import convert_dataframe_to_langchain_docs
from src.vectorstore import (
    download_and_get_local_embeddings,
    ensure_pinecone_index_exists,
    store_documents_in_pinecone,
)

load_dotenv()


def run_batch_indexing(
    csv_file: Optional[str] = None,
    batch_size: int = 500,
    delay_between_batches: float = 0.2,
    max_docs: Optional[int] = None,
    index_name: str = "ecommerce-products",
):
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_file = csv_file or os.path.join(workspace_dir, "data", "amazon_preprocessed.csv")

    if not os.path.exists(csv_file):
        raise FileNotFoundError(
            f"Preprocessed dataset '{csv_file}' not found."
        )

    print(f"Loading dataset from '{csv_file}'...")
    df = pd.read_csv(csv_file)

    if max_docs:
        print(f"Limiting indexing to first {max_docs:,} rows...")
        df = df.iloc[:max_docs]

    print(f"Converting {len(df):,} rows into LangChain Document objects...")
    docs = convert_dataframe_to_langchain_docs(df)

    embedding_model = download_and_get_local_embeddings()
    ensure_pinecone_index_exists(index_name=index_name, dimension=384)

    total_docs = len(docs)
    total_batches = (total_docs + batch_size - 1) // batch_size
    print(
        f"Starting fast local vectorization & upload of {total_docs:,} documents to Pinecone "
        f"({total_batches} batches of up to {batch_size} docs each)..."
    )

    start_time = time.time()
    for batch_num, i in enumerate(range(0, total_docs, batch_size), start=1):
        batch_docs = docs[i : i + batch_size]
        print(
            f"--> Processing Batch {batch_num}/{total_batches} "
            f"({len(batch_docs)} items | Progress: {i + len(batch_docs):,}/{total_docs:,})..."
        )

        store_documents_in_pinecone(
            documents=batch_docs,
            index_name=index_name,
            embedding_model=embedding_model,
        )

        if i + batch_size < total_docs and delay_between_batches > 0:
            time.sleep(delay_between_batches)

    total_time = time.time() - start_time
    print("\n" + "=" * 50)
    print(f"Successfully indexed {total_docs:,} products to Pinecone Cloud!")
    print(f"Total time taken: {total_time:.2f} seconds ({total_time / 60:.2f} minutes).")
    print("=" * 50)


if __name__ == "__main__":
    doc_limit = 500 if len(sys.argv) <= 1 else (None if sys.argv[1].lower() == "full" else int(sys.argv[1]))

    run_batch_indexing(
        batch_size=500,
        delay_between_batches=0.2,
        max_docs=doc_limit,
    )
