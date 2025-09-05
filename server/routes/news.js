import express from "express";
import axios from "axios";

const router = express.Router();

// Add CORS headers
router.use((err, req, res, next) => {
  console.error('News router error:', err);
  res.status(500).json({ 
    error: {
      message: "News service error",
      details: err.message 
    }
  });
});

// Normalize News API article
function normalizeNewsApiArticle(article) {
  return {
    title: article.title,
    description: article.description,
    content: article.content,
    url: article.url,
    publishedAt: article.publishedAt,
    source: article.source?.name || "NewsAPI",
    country: "",
  };
}

// Normalize GNews article
function normalizeGNewsArticle(article) {
  return {
    title: article.title,
    description: article.description,
    content: article.content,
    url: article.url,
    publishedAt: article.publishedAt,
    source: article.source?.name || article.source?.url || "GNews",
    country: article.source?.country || "",
  };
}

// Normalize ReliefWeb publication
function normalizeReliefWebPublication(pub) {
  return {
    title: pub.fields?.title,
    description: pub.fields?.body,
    url: pub.fields?.url,
    publishedAt: pub.fields?.date,
    source: "ReliefWeb",
    country: pub.fields?.country?.[0] || "",
  };
}

// Normalize Eventbrite event
function normalizeEventbriteEvent(event) {
  return {
    title: event.name?.text,
    description: event.description?.text,
    url: event.url,
    start: { local: event.start?.local },
    date: event.start?.local,
    publishedAt: event.start?.local,
    source: "Eventbrite",
    country: event.venue?.address?.country_code || "",
    venue: event.venue?.name,
  };
}

// NEWS endpoint
router.get("/news", async (req, res) => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    const gnewsApiKey = process.env.GNEWS_API_KEY;

    if (!newsApiKey || !gnewsApiKey) {
      return res.status(500).json({ 
        error: {
          message: "Missing news API keys",
          details: "Check server configuration"
        }
      });
    }

    const newsApiUrl = `https://newsapi.org/v2/everything?q=climate&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`;
    const gnewsUrl = `https://gnews.io/api/v4/search?q=climate&token=${gnewsApiKey}&max=50&lang=en`;
    const reliefwebUrl = `https://api.reliefweb.int/v1/reports?appname=climate_dashboard&query[value]=climate&limit=50&sort[]=date:desc&fields[]=title&fields[]=body&fields[]=date&fields[]=url&fields[]=country`;

    const [newsApiResp, gnewsResp, reliefwebResp] = await Promise.allSettled([
      axios.get(newsApiUrl, { timeout: 8000 }),
      axios.get(gnewsUrl, { timeout: 8000 }),
      axios.get(reliefwebUrl, { timeout: 8000 }),
    ]);

    const newsApiArticles = newsApiResp.status === "fulfilled"
      ? (newsApiResp.value.data.articles || []).map(normalizeNewsApiArticle)
      : [];
    const gnewsArticles = gnewsResp.status === "fulfilled"
      ? (gnewsResp.value.data.articles || []).map(normalizeGNewsArticle)
      : [];
    const reliefwebPublications = reliefwebResp.status === "fulfilled"
      ? (reliefwebResp.value.data.data || []).map(normalizeReliefWebPublication)
      : [];

    const combinedNews = [...newsApiArticles, ...gnewsArticles, ...reliefwebPublications];

    // Deduplicate by URL
    const uniqueMap = new Map();
    combinedNews.forEach(item => {
      if (item.url && !uniqueMap.has(item.url)) {
        uniqueMap.set(item.url, item);
      }
    });

    res.json({ data: Array.from(uniqueMap.values()) });
  } catch (error) {
    res.status(500).json({ 
      error: {
        message: "Failed to fetch news",
        details: error.message 
      }
    });
  }
});

// EVENTS endpoint
router.get("/events", async (req, res) => {
  try {
    const eventbriteApiKey = process.env.EVENTBRITE_API_KEY;
    if (!eventbriteApiKey) {
      return res.status(500).json({ 
        error: {
          message: "Missing Eventbrite API key",
          details: "Check server configuration"
        }
      });
    }

    const nowISO = new Date().toISOString();
    const lastMonthISO = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const nextMonthISO = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const eventbriteUrl = `https://www.eventbriteapi.com/v3/events/search/?q=climate&start_date.range_start=${lastMonthISO}&start_date.range_end=${nextMonthISO}&sort_by=date&expand=venue&token=${eventbriteApiKey}&page_size=50`;

    const eventbriteResp = await axios.get(eventbriteUrl, { timeout: 8000 });

    const events = (eventbriteResp.data.events || []).map(normalizeEventbriteEvent);

    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ 
      error: {
        message: "Failed to fetch events",
        details: error.message 
      }
    });
  }
});

export default router;