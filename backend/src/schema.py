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
        description="The price of the e-commerce product in INR (Indian Rupees). Use for filtering products by cost (e.g., price < 30000 or price >= 500).",
        type="float",
    ),
    AttributeInfo(
        name="rating",
        description="The average customer rating of the product on a 0.0 to 5.0 scale. Use for filtering by customer satisfaction or minimum quality score.",
        type="float",
    ),
    AttributeInfo(
        name="category",
        description="The main department or category of the product (e.g., 'tv, audio & cameras', 'appliances', 'car & motorbike', 'sports & fitness', 'home & kitchen', 'accessories', 'bags & luggage', 'beauty & health'). Use for filtering by department.",
        type="string",
    ),
]

document_content_description = (
    "Summary of an e-commerce product combining the product title/name and sub-category"
)
