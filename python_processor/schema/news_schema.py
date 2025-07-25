"""Schema definitions for news-related data models."""

from typing import Optional
from pydantic import BaseModel, HttpUrl

class NewsItem(BaseModel):
    """Data model representing a news article or item."""

    source: str
    title: str
    link: HttpUrl
    summary: Optional[str] = None
    image: Optional[HttpUrl] = None
