"""Module for fetching and processing climate-related news articles."""

import os
import asyncio
from typing import List

import requests
import feedparser

from ..schema.news_schema import NewsItem

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
EVENTBRITE_API_KEY = os.getenv("EVENTBRITE_API_KEY")


async def fetch_newsapi() -> List[NewsItem]:
    """Fetch news articles from NewsAPI."""
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q=climate+change&language=en&pageSize=5&apiKey={NEWS_API_KEY}"
    )
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    return [
        NewsItem(
            source="NewsAPI",
            title=article.get("title", ""),
            link=article.get("url", ""),
            summary=article.get("description", ""),
            image=article.get("urlToImage"),
        )
        for article in data.get("articles", [])
    ]


async def fetch_reliefweb() -> List[NewsItem]:
    """Fetch climate-related reports from ReliefWeb API."""
    url = "https://api.reliefweb.int/v1/reports?appname=climawatch&query[value]=climate&limit=5"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    return [
        NewsItem(
            source="ReliefWeb",
            title=fields.get("title", ""),
            link=fields.get("url", ""),
            summary=fields.get("body-html", "")[:200],
            image=None,
        )
        for item in data.get("data", [])
        if (fields := item.get("fields"))
    ]


async def fetch_unfccc_rss() -> List[NewsItem]:
    """Parse UNFCCC RSS feed for recent news items."""
    feed = feedparser.parse("https://unfccc.int/rss.xml")

    return [
        NewsItem(
            source="UNFCCC",
            title=entry.title,
            link=entry.link,
            summary=entry.get("summary", ""),
            image=None,
        )
        for entry in feed.entries[:5]
    ]


async def fetch_eventbrite_events() -> List[NewsItem]:
    """Fetch upcoming climate-related events from Eventbrite."""
    url = "https://www.eventbriteapi.com/v3/events/search/"
    headers = {"Authorization": f"Bearer {EVENTBRITE_API_KEY}"}
    params = {
        "q": "climate",
        "sort_by": "date",
        "page_size": 5,
        "expand": "venue",
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        return [
            NewsItem(
                source="Eventbrite",
                title=event.get("name", {}).get("text", ""),
                link=event.get("url", ""),
                summary=(event.get("description", {}).get("text") or "")[:200],
                image=None,
            )
            for event in data.get("events", [])
        ]
    except requests.RequestException as err:
        print("Eventbrite fetch failed:", err)
        return []


async def fetch_climate_news() -> List[NewsItem]:
    """Fetch and aggregate news from all supported sources."""
    results = await asyncio.gather(
        fetch_newsapi(),
        fetch_reliefweb(),
        fetch_unfccc_rss(),
        fetch_eventbrite_events(),
        return_exceptions=True,
    )

    news_items: List[NewsItem] = []
    for result in results:
        if isinstance(result, list):
            news_items.extend(result)
    return news_items
