"""
Authentication API routes: registration, login, and profile inspection.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends

from src.database import get_database
from src.schemas.auth import UserRegister, UserLogin, Token, UserResponse
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
    Create a new user with email, username, and password.
    Returns a JWT access token upon successful registration.
    """
    db = get_database()

    # Normalize fields
    email = payload.email.strip().lower()
    username = payload.username.strip()

    # Check for existing user
    existing_user = await db.users.find_one({
        "$or": [{"email": email}, {"username": username}]
    })

    if existing_user:
        if existing_user.get("email") == email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    user_doc = {
        "username": username,
        "email": email,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email, username=username)

    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            username=username,
            email=email,
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
    email = payload.email.strip().lower()

    user = await db.users.find_one({"email": email})
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
    username = user.get("username", email.split("@")[0])
    access_token = create_access_token(user_id, user["email"], username=username)

    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            username=username,
            email=user["email"],
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve profile information for the authenticated user."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
    )
