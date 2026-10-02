"""
Pydantic schemas for shopping cart operations and AI cart summary.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Request body when adding a product to the cart."""
    product_id: str = Field(..., description="Unique product identifier (hash of page_content).")
    title: str = Field(..., description="Product title.")
    price: float = Field(..., ge=0, description="Product price in INR.")
    image: Optional[str] = Field(None, description="Product image URL.")
    category: Optional[str] = Field(None, description="Product category.")
    quantity: int = Field(1, ge=1, le=99, description="Quantity to add.")


class CartItemUpdate(BaseModel):
    """Request body for updating item quantity."""
    quantity: int = Field(..., ge=1, le=99, description="New quantity.")


class CartItem(BaseModel):
    """A single item in the user's cart."""
    product_id: str
    title: str
    price: float
    image: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1


class CartResponse(BaseModel):
    """Full cart response with items and computed total."""
    items: List[CartItem] = Field(default_factory=list)
    item_count: int = 0
    total_price: float = 0.0


class CategoryBreakdown(BaseModel):
    """Price breakdown per product category."""
    category: str
    item_count: int
    subtotal: float


class CartSummaryResponse(BaseModel):
    """AI-generated cart summary with pricing breakdown."""
    summary: str = Field(..., description="Groq-generated natural language cart summary.")
    total_price: float
    item_count: int
    category_breakdown: List[CategoryBreakdown] = Field(default_factory=list)


class GuestCartSummaryRequest(BaseModel):
    """Request body for generating Groq AI cart summary for guest sessions."""
    items: List[CartItem] = Field(..., min_length=1, description="List of items in the guest cart.")
