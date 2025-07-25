"""
This module defines API routes for fetching and serving climate news items
from various external sources such as NewsAPI, ReliefWeb, UNFCCC RSS, and Eventbrite.
"""

from typing import List, Dict

from fastapi import APIRouter

from python_processor.services import news_fetcher
from ..schema.news_schema import NewsItem

router = APIRouter()

@router.get("/news", response_model=Dict[str, List[NewsItem]])
async def get_news() -> Dict[str, List[NewsItem]]:
    """
    Fetches climate news from multiple sources concurrently and returns
    a dictionary mapping source names to lists of news items.
    """
    news_items = await news_fetcher.fetch_climate_news()
    # Group news items by source
    grouped = {}
    for item in news_items:
        grouped.setdefault(item.source, []).append(item)
    return grouped
