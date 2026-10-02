"""
Authentication API routes: registration, login, and user profile.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from pymongo.errors import DuplicateKeyError

from src.database import get_database
from src.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from src.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(payload: UserRegister):
    """
    Create a new user account with username, email, and password.
    Returns a JWT access token on success.
    """
    db = get_database()

    # Hash the password
    password_hash = hash_password(payload.password)

    user_doc = {
        "username": payload.username.strip().lower(),
        "email": payload.email.strip().lower(),
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await db.users.insert_one(user_doc)
    except DuplicateKeyError:
        # Check which field caused the duplicate
        existing = await db.users.find_one({"email": user_doc["email"]})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, user_doc["email"])

    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            username=user_doc["username"],
            email=user_doc["email"],
        ),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Login with email and password",
)
async def login(payload: UserLogin):
    """
    Authenticate a user with email and password.
    Returns a JWT access token on success.
    """
    db = get_database()

    user = await db.users.find_one({"email": payload.email.strip().lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["email"])

    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            username=user["username"],
            email=user["email"],
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    Requires a valid JWT Bearer token.
    """
    return UserResponse(**current_user)
