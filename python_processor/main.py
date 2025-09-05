"""
Main application entry point for the JuaClima FastAPI backend.
"""

# Standard library imports
import logging

# Third-party imports
from fastapi import FastAPI

# Local application imports
from .routes import health, upload

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI(title="JuaClima FastAPI Backend")

# Include API routers
app.include_router(health.router)
app.include_router(upload.router)