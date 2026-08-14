import os
from typing import List
import pandas as pd
from langchain_core.documents import Document


def convert_dataframe_to_langchain_docs(df: pd.DataFrame) -> List[Document]:
    """
    Converts a preprocessed pandas DataFrame into a list of LangChain Document objects.
    """
    required_columns = ["text", "price", "rating", "category"]

    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise KeyError(f"DataFrame is missing required column(s): {missing_cols}")

    clean_df = df.dropna(subset=required_columns).copy()
    documents: List[Document] = []

    for row in clean_df.itertuples(index=False):
        text_content = str(row.text).strip()
        if not text_content:
            continue

        try:
            price_val = float(row.price)
            rating_val = float(row.rating)
            category_val = str(row.category).strip()

            metadata = {
                "price": price_val,
                "rating": rating_val,
                "category": category_val,
            }

            doc = Document(
                page_content=text_content,
                metadata=metadata,
            )
            documents.append(doc)
        except (ValueError, TypeError):
            continue

    return documents


if __name__ == "__main__":
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    preprocessed_csv = os.path.join(workspace_dir, "data", "amazon_preprocessed.csv")
    if os.path.exists(preprocessed_csv):
        df = pd.read_csv(preprocessed_csv)
        docs = convert_dataframe_to_langchain_docs(df)
        print(f"Successfully converted DataFrame to {len(docs):,} LangChain Documents.")
