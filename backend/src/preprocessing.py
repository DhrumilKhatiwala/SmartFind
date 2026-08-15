import os
import pandas as pd


def clean_currency_to_float(series: pd.Series) -> pd.Series:
    """
    Cleans currency strings by removing currency symbols, commas, and whitespace,
    then safely converting the series to float.
    """
    cleaned = series.astype(str).str.replace(r"[^\d.]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def preprocess_and_update_amazon_data(
    input_file: str,
    output_preprocessed_csv: str,
    output_amazon_csv: str,
    deduplicate_by_name: bool = True,
) -> pd.DataFrame:
    """
    Preprocesses the complete Amazon dataset:
    1. Cleans prices (discount_price with actual_price fallback)
    2. Cleans ratings (0.0 to 5.0)
    3. Formats combined search text (name - sub_category)
    4. Deduplicates on unique product name (Option A)
    5. Directly updates amazon.csv and amazon_preprocessed.csv
    """
    print(f"Loading raw Amazon dataset from: {input_file}...")
    df = pd.read_csv(input_file, low_memory=False)
    print(f"Loaded {len(df):,} raw records.")

    # 1. Clean prices
    if "discount_price" in df.columns:
        df["price"] = clean_currency_to_float(df["discount_price"])
        if "actual_price" in df.columns:
            df["price"] = df["price"].fillna(clean_currency_to_float(df["actual_price"]))
    elif "price" in df.columns:
        df["price"] = clean_currency_to_float(df["price"])
    else:
        df["price"] = pd.NA

    # 2. Clean ratings
    rating_col = "ratings" if "ratings" in df.columns else "rating"
    df["rating"] = pd.to_numeric(df[rating_col], errors="coerce")

    # 3. Clean string features
    name_col = df["name"].fillna("").astype(str).str.strip() if "name" in df.columns else pd.Series("", index=df.index)
    sub_cat_col = df["sub_category"].fillna("").astype(str).str.strip() if "sub_category" in df.columns else pd.Series("", index=df.index)
    df["name_clean"] = name_col
    df["text"] = (name_col + " - " + sub_cat_col).str.strip(" -")

    # 4. Clean category
    if "main_category" in df.columns:
        df["category"] = df["main_category"].fillna("Unknown").astype(str).str.strip()
    elif "category" in df.columns:
        df["category"] = df["category"].fillna("Unknown").astype(str).str.strip()
    else:
        df["category"] = "Unknown"

    # Filter rows where price, rating, and name are present
    valid_mask = df["price"].notna() & df["rating"].notna() & (df["name_clean"].str.len() > 0)
    df_valid = df[valid_mask].copy()
    print(f"Valid records with numerical price & rating: {len(df_valid):,}")

    # 5. Deduplicate by unique product title (Option A)
    if deduplicate_by_name:
        df_valid = df_valid.drop_duplicates(subset=["name_clean"], keep="first")
        print(f"Unique distinct products after title deduplication: {len(df_valid):,}")

    df_valid = df_valid.reset_index(drop=True)

    # 6. Update amazon_preprocessed.csv
    target_columns = ["text", "price", "rating", "category"]
    preprocessed_df = df_valid[target_columns].copy()
    os.makedirs(os.path.dirname(output_preprocessed_csv), exist_ok=True)
    preprocessed_df.to_csv(output_preprocessed_csv, index=False)
    print(f"--> Successfully updated '{output_preprocessed_csv}' ({len(preprocessed_df):,} rows).")

    # 7. Update amazon.csv (rich metadata for images, rating counts, actual prices)
    metadata_cols = [
        c for c in ["name", "main_category", "sub_category", "image", "link", "ratings", "no_of_ratings", "discount_price", "actual_price"]
        if c in df_valid.columns
    ]
    df_valid[metadata_cols].to_csv(output_amazon_csv, index=False)
    print(f"--> Successfully updated '{output_amazon_csv}' ({len(df_valid):,} rows).")

    return preprocessed_df


if __name__ == "__main__":
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(workspace_dir)

    input_csv = os.path.join(project_root, "archive", "Amazon-Products.csv")
    output_prep_csv = os.path.join(workspace_dir, "data", "amazon_preprocessed.csv")
    output_amazon_csv = os.path.join(workspace_dir, "data", "amazon.csv")

    preprocess_and_update_amazon_data(
        input_file=input_csv,
        output_preprocessed_csv=output_prep_csv,
        output_amazon_csv=output_amazon_csv,
        deduplicate_by_name=True,
    )
