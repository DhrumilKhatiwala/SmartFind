import os
import pandas as pd


def clean_currency_to_float(series: pd.Series) -> pd.Series:
    """
    Cleans currency strings by removing currency symbols, commas, and whitespace,
    then safely converting the series to float.
    """
    cleaned = series.astype(str).str.replace(r"[^\d.]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def preprocess_ecommerce_data(
    file_path: str, output_path: str = None
) -> pd.DataFrame:
    """
    Preprocesses e-commerce CSV data by cleaning prices, ratings,
    handling missing values, combining text features, and selecting final columns.
    """
    df = pd.read_csv(file_path, low_memory=False)

    # Clean price fields
    if "discount_price" in df.columns:
        df["price"] = clean_currency_to_float(df["discount_price"])
        if "actual_price" in df.columns:
            df["price"] = df["price"].fillna(clean_currency_to_float(df["actual_price"]))
    elif "price" in df.columns:
        df["price"] = clean_currency_to_float(df["price"])
    else:
        df["price"] = pd.NA

    # Convert rating column to numeric safely
    rating_col = "ratings" if "ratings" in df.columns else "rating"
    df["rating"] = pd.to_numeric(df[rating_col], errors="coerce")

    # Handle missing string features
    name_col = df["name"].fillna("").astype(str).str.strip() if "name" in df.columns else pd.Series("", index=df.index)
    sub_cat_col = df["sub_category"].fillna("").astype(str).str.strip() if "sub_category" in df.columns else pd.Series("", index=df.index)

    # Create combined text column
    df["text"] = (name_col + " - " + sub_cat_col).str.strip(" -")

    # Map main category column
    if "main_category" in df.columns:
        df["category"] = df["main_category"].fillna("Unknown").astype(str).str.strip()
    elif "category" in df.columns:
        df["category"] = df["category"].fillna("Unknown").astype(str).str.strip()
    else:
        df["category"] = "Unknown"

    # Drop missing numerical metrics
    df = df.dropna(subset=["price", "rating"])
    df = df[df["text"].str.len() > 0]

    # Target output columns
    target_columns = ["text", "price", "rating", "category"]
    df = df[target_columns].reset_index(drop=True)

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)

    return df


if __name__ == "__main__":
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_csv = os.path.join(workspace_dir, "data", "amazon.csv")
    output_csv = os.path.join(workspace_dir, "data", "amazon_preprocessed.csv")

    if os.path.exists(input_csv):
        cleaned_df = preprocess_ecommerce_data(input_csv, output_csv)
        print(f"Successfully processed {len(cleaned_df):,} rows.")
        print(cleaned_df.head(10))
