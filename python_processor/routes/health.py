"""
Health check route for the JuaClima FastAPI backend.
Provides a simple status message for monitoring and testing.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    """
    Health check endpoint.

    Returns:
        dict: A message indicating the backend is running.
    """
    return {"message": "JuaClima FastAPI backend is running."}
