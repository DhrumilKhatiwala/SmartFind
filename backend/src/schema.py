"""
Metadata Schema Definition for LangChain SelfQueryRetriever.
Defines AttributeInfo objects for structured metadata filtering over Pinecone vector store.
"""

try:
    from langchain.chains.query_constructor.base import AttributeInfo
except ImportError:
    from langchain_classic.chains.query_constructor.base import AttributeInfo

metadata_field_info = [
    AttributeInfo(
        name="price",
        description="The price of the e-commerce product in INR (Indian Rupees). Use for numerical budget filtering (e.g., price < 45000 or price >= 500).",
        type="float",
    ),
    AttributeInfo(
        name="rating",
        description="The average customer rating on a 0.0 to 5.0 scale. Use for filtering by minimum rating or star satisfaction score.",
        type="float",
    ),
    AttributeInfo(
        name="category",
        description=(
            "The exact indexed department of the product. MUST be one of these exact values: "
            "'tv, audio & cameras' (for electronics, laptops, computers, headphones, smartphones, TVs, gadgets), "
            "'appliances' (for air fryers, refrigerators, washing machines, microwaves, ACs), "
            "'home & kitchen', 'men\'s shoes', 'women\'s shoes', 'men\'s clothing', "
            "'kids\' fashion', 'beauty & health', 'sports & fitness', 'toys & baby products', 'accessories'."
        ),
        type="string",
    ),
]

document_content_description = (
    "Summary of an e-commerce product combining the product title/name and sub-category"
)
