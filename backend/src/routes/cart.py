"""
Shopping cart API routes: CRUD operations and Groq-powered AI cart summary.
Supports both persistent MongoDB carts (for authenticated users) and
stateless guest session cart summarization.
"""

import os
from datetime import datetime, timezone
from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from groq import Groq

from src.database import get_database
from src.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartItem,
    CartResponse,
    CategoryBreakdown,
    CartSummaryResponse,
    GuestCartSummaryRequest,
)
from src.services.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


def _build_cart_response(cart_doc) -> CartResponse:
    """Helper to build a CartResponse from a MongoDB cart document."""
    if not cart_doc or not cart_doc.get("items"):
        return CartResponse(items=[], item_count=0, total_price=0.0)

    items = [CartItem(**item) for item in cart_doc["items"]]
    total = sum(item.price * item.quantity for item in items)
    count = sum(item.quantity for item in items)

    return CartResponse(items=items, item_count=count, total_price=round(total, 2))


def _generate_groq_summary(items: list) -> CartSummaryResponse:
    """
    Helper to generate Groq AI summary and category breakdown from a list of cart item dictionaries.
    Shared by both registered user and guest user workflows.
    """
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add some products first!",
        )

    # Build category breakdown
    cat_map = defaultdict(lambda: {"count": 0, "subtotal": 0.0})
    for item in items:
        cat = item.get("category") or "Uncategorized"
        qty = item.get("quantity", 1)
        price = item.get("price", 0.0)
        cat_map[cat]["count"] += qty
        cat_map[cat]["subtotal"] += price * qty

    category_breakdown = [
        CategoryBreakdown(
            category=cat,
            item_count=data["count"],
            subtotal=round(data["subtotal"], 2),
        )
        for cat, data in sorted(cat_map.items())
    ]

    total_price = round(sum(item.get("price", 0.0) * item.get("quantity", 1) for item in items), 2)
    item_count = sum(item.get("quantity", 1) for item in items)

    # Build prompt
    item_lines = []
    for item in items:
        line = f"- {item.get('title', 'Unknown')} | Price: Rs.{item.get('price', 0):,.0f} | Qty: {item.get('quantity', 1)} | Category: {item.get('category', 'N/A')}"
        item_lines.append(line)
    items_text = "\n".join(item_lines)

    prompt = f"""You are a smart shopping assistant. Summarize this shopping cart concisely in 3-5 sentences.

Cart Items:
{items_text}

Total: Rs.{total_price:,.2f} ({item_count} items)

In your summary:
1. Briefly describe what the customer is shopping for overall
2. Mention the most expensive item
3. If items complement each other, point that out
4. End with the total cost

Keep it conversational, helpful, and under 100 words."""

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return CartSummaryResponse(
            summary=f"Your cart contains {item_count} item(s) across {len(category_breakdown)} category/categories, totaling Rs.{total_price:,.2f}.",
            total_price=total_price,
            item_count=item_count,
            category_breakdown=category_breakdown,
        )

    try:
        client = Groq(api_key=groq_api_key)
        model_name = os.getenv("GROQ_CART_MODEL", "qwen/qwen3.8-27b")
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful shopping assistant that provides concise, friendly cart summaries."},
                {"role": "user", "content": prompt},
            ],
            model=model_name,
            temperature=0.6,
            max_tokens=250,
        )
        msg = chat_completion.choices[0].message
        summary_text = (msg.content or getattr(msg, "reasoning", "") or "").strip()
        if not summary_text:
            summary_text = f"Your cart contains {item_count} item(s) across {len(category_breakdown)} category/categories, totaling Rs.{total_price:,.2f}."
    except Exception as e:
        print(f"[Cart Summary] Groq API error: {e}")
        summary_text = f"Your cart contains {item_count} item(s) across {len(category_breakdown)} category/categories, totaling Rs.{total_price:,.2f}."

    return CartSummaryResponse(
        summary=summary_text,
        total_price=total_price,
        item_count=item_count,
        category_breakdown=category_breakdown,
    )


@router.get(
    "",
    response_model=CartResponse,
    summary="Get the current user's cart",
)
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Retrieve all items in the authenticated user's cart from MongoDB."""
    db = get_database()
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    return _build_cart_response(cart)


@router.post(
    "/add",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Add a product to the cart",
)
async def add_to_cart(
    payload: CartItemAdd,
    current_user: dict = Depends(get_current_user),
):
    """
    Add a product to the user's cart in MongoDB. If the product already exists,
    its quantity is incremented by the specified amount.
    """
    db = get_database()
    user_id = current_user["id"]

    cart = await db.carts.find_one({"user_id": user_id})

    if not cart:
        cart_doc = {
            "user_id": user_id,
            "items": [
                {
                    "product_id": payload.product_id,
                    "title": payload.title,
                    "price": payload.price,
                    "image": payload.image,
                    "category": payload.category,
                    "quantity": payload.quantity,
                }
            ],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await db.carts.insert_one(cart_doc)
        return _build_cart_response(cart_doc)

    items = cart.get("items", [])
    found = False
    for item in items:
        if item["product_id"] == payload.product_id:
            item["quantity"] = min(item["quantity"] + payload.quantity, 99)
            found = True
            break

    if not found:
        items.append(
            {
                "product_id": payload.product_id,
                "title": payload.title,
                "price": payload.price,
                "image": payload.image,
                "category": payload.category,
                "quantity": payload.quantity,
            }
        )

    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc)}},
    )

    cart["items"] = items
    return _build_cart_response(cart)


@router.patch(
    "/{product_id}",
    response_model=CartResponse,
    summary="Update quantity of a cart item",
)
async def update_cart_item(
    product_id: str,
    payload: CartItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the quantity of an existing item in the cart."""
    db = get_database()
    user_id = current_user["id"]

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found.")

    item_idx = None
    for idx, item in enumerate(cart.get("items", [])):
        if item["product_id"] == product_id:
            item_idx = idx
            break

    if item_idx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart.")

    cart["items"][item_idx]["quantity"] = payload.quantity

    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc)}},
    )

    return _build_cart_response(cart)


@router.delete(
    "/{product_id}",
    response_model=CartResponse,
    summary="Remove an item from the cart",
)
async def remove_cart_item(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a specific product from the user's cart."""
    db = get_database()
    user_id = current_user["id"]

    await db.carts.update_one(
        {"user_id": user_id},
        {
            "$pull": {"items": {"product_id": product_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    updated_cart = await db.carts.find_one({"user_id": user_id})
    return _build_cart_response(updated_cart)


@router.delete(
    "",
    response_model=CartResponse,
    summary="Clear the entire cart",
)
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Remove all items from the user's cart."""
    db = get_database()
    user_id = current_user["id"]

    await db.carts.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "items": [],
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return CartResponse(items=[], item_count=0, total_price=0.0)


@router.get(
    "/summary",
    response_model=CartSummaryResponse,
    summary="Get AI-generated cart summary using Groq (Registered Users)",
)
async def get_cart_summary(current_user: dict = Depends(get_current_user)):
    """
    Generate an AI-powered summary of the registered user's MongoDB cart using Groq.
    Groups items by category, highlights key insights, and provides the total cost.
    """
    db = get_database()
    user_id = current_user["id"]

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart or not cart.get("items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add some products first!",
        )

    return _generate_groq_summary(cart["items"])


@router.post(
    "/guest-summary",
    response_model=CartSummaryResponse,
    summary="Get AI-generated cart summary using Groq (Guest Sessions)",
)
async def get_guest_cart_summary(payload: GuestCartSummaryRequest):
    """
    Generate an AI-powered summary for a guest user's session cart.
    Accepts items directly in payload without requiring MongoDB authentication.
    """
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add some products first!",
        )

    items_data = [item.model_dump() for item in payload.items]
    return _generate_groq_summary(items_data)
