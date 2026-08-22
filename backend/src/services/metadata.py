import os
from typing import Dict, Any, List
import pyarrow.dataset as ds
import pyarrow.compute as pc

# In-memory product metadata cache (populated dynamically on demand)
product_lookup: Dict[str, Dict[str, Any]] = {}
metadata_dataset: Any = None


def init_metadata_dataset():
    """
    Initializes the PyArrow dataset reference without loading Parquet data into RAM.
    Operates with ~0MB RAM usage via memory-mapped disk streaming.
    """
    global metadata_dataset
    dataset_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data",
        "metadata.parquet",
    )
    if os.path.exists(dataset_path):
        metadata_dataset = ds.dataset(dataset_path, format="parquet")
        print(f"Loaded 0-RAM metadata dataset from: {dataset_path}")
    else:
        print(f"Metadata parquet file not found at: {dataset_path}")
    return metadata_dataset


def enrich_with_parquet_metadata(docs: List[Any]) -> None:
    """
    Performs fast, vectorized metadata enrichment directly from the memory-mapped Parquet file.
    Only reads disk blocks for the requested top-k product names.
    """
    global metadata_dataset, product_lookup

    if not docs or metadata_dataset is None:
        return

    # Find which product titles need disk lookup
    needed_names = []
    for doc in docs:
        name_clean = doc.page_content.split(" - ")[0].strip()
        if name_clean not in product_lookup:
            needed_names.append(name_clean)

    if needed_names:
        try:
            # Query disk scanner for exact matched names
            filter_expr = pc.is_in(
                ds.field("name"),
                value_set=pc.pa.array(list(set(needed_names))),
            )
            table = metadata_dataset.to_table(
                filter=filter_expr,
                columns=[
                    "name",
                    "sub_category",
                    "image",
                    "no_of_ratings",
                    "discount_price",
                    "actual_price",
                ],
            )
            pydict_list = table.to_pylist()
            for row in pydict_list:
                n = row.get("name", "").strip()
                if n and n not in product_lookup:
                    product_lookup[n] = {
                        "sub_category": row.get("sub_category"),
                        "image": row.get("image"),
                        "no_of_ratings": row.get("no_of_ratings"),
                        "discount_price": row.get("discount_price"),
                        "actual_price": row.get("actual_price"),
                    }
        except Exception as e:
            print(f"Error reading metadata from Parquet: {e}")

    # Merge enriched metadata into document metadata dict
    for doc in docs:
        name_clean = doc.page_content.split(" - ")[0].strip()
        if name_clean in product_lookup:
            for k, v in product_lookup[name_clean].items():
                if k not in doc.metadata or doc.metadata[k] is None:
                    doc.metadata[k] = v
