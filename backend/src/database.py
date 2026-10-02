"""
MongoDB async connection manager using Motor.
Provides a singleton client and database reference for the SmartFind application.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")

# Module-level singleton
_client = None
_db = None


def get_database():
    """
    Returns the MongoDB database instance.
    Must be called after connect_to_mongo().
    """
    if _db is None:
        raise RuntimeError("MongoDB is not connected. Call connect_to_mongo() first.")
    return _db


async def connect_to_mongo():
    """
    Initialize the Motor async client and connect to MongoDB Atlas.
    Called during FastAPI lifespan startup.
    """
    global _client, _db

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("[MongoDB] MONGODB_URI not set - user auth & cart features disabled.")
        return False

    db_name = os.getenv("MONGODB_DB_NAME", "smartfind")

    try:
        _client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Verify connection
        await _client.admin.command("ping")
        _db = _client[db_name]

        # Create indexes for performance
        await _db.users.create_index("email", unique=True)
        await _db.users.create_index("username", unique=True)
        await _db.carts.create_index("user_id", unique=True)

        print(f"[MongoDB] Connected to database '{db_name}' successfully.")
        return True
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        _client = None
        _db = None
        return False


async def close_mongo_connection():
    """
    Gracefully close the MongoDB connection.
    Called during FastAPI lifespan shutdown.
    """
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("[MongoDB] Connection closed.")


def is_mongo_connected():
    """Check if MongoDB is connected."""
    return _db is not None
