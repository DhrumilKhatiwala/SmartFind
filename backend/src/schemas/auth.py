"""
Pydantic schemas for user authentication (registration, login, JWT tokens).
"""

from pydantic import BaseModel, Field, EmailStr


class UserRegister(BaseModel):
    """Request body for user registration."""
    username: str = Field(..., min_length=3, max_length=30, description="Unique username.")
    email: EmailStr = Field(..., description="Valid email address.")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars).")


class UserLogin(BaseModel):
    """Request body for user login."""
    email: EmailStr = Field(..., description="Registered email address.")
    password: str = Field(..., description="Account password.")


class UserResponse(BaseModel):
    """Public user profile returned after auth operations."""
    id: str = Field(..., description="User ID.")
    username: str
    email: str


class Token(BaseModel):
    """JWT token response after successful login/registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
