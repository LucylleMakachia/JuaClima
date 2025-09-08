import express from "express";
import axios from "axios";
import Parser from "rss-parser";
import {
  REGION_MAPPING,
  COUNTRY_TO_REGION,
  CLIMATE_KEYWORDS,
  calculateRelevanceScore,
  normalizeReliefWebPublication,
  normalizeRSSItem,
  safeParseRSS,
  normalizeGNewsArticle,
  normalizeEventbriteEvent,
  getRegion,
  deduplicateAdvanced,
  processAndFilterArticles,
  filterByKeyword,
  paginate,
  getTopKeywords,
  getTrendingTopics,
  getDailyVolume,
  fetchPrimarySources,
  fetchSecondarySources,
  fetchEventsFromSources,
  isCacheValid,
  paginateAdvanced,
  fetchWithRetry
} from "../utils/newsUtils.js";

const router = express.Router();
const parser = new Parser();

// Enhanced caching system with unified structure
const caches = {
  primary: { data: [], timestamp: 0, ttl: 15 * 60 * 1000 }, // 15 minutes
  secondary: { data: [], timestamp: 0, ttl: 10 * 60 * 1000 }, // 10 minutes
  processed: { data: [], timestamp: 0, ttl: 5 * 60 * 1000 }, // 5 minutes
  events: { data: [], timestamp: 0, ttl: 30 * 60 * 1000 } // 30 minutes
};

// ROUTES

// Main news endpoint with enhanced filtering
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      keyword = "", 
      region = "",
      type = "news",
      minRelevance = 2
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const minRelevanceScore = Math.max(0, parseInt(minRelevance));

    // Handle events type
    if (type === "events") {
      return handleEventsRequest(req, res);
    }

    // Check if we have valid processed cache
    if (isCacheValid(caches.processed) && !region && !keyword && minRelevanceScore <= 2) {
      const paginationResult = paginateAdvanced(caches.processed.data, pageNum, limitNum);
      
      // Add source distribution info
      const sourceDistribution = {};
      caches.processed.data.forEach(item => {
        sourceDistribution[item.source] = (sourceDistribution[item.source] || 0) + 1;
      });

      return res.json({
        ...paginationResult,
        metadata: {
          sourceDistribution,
          averageRelevanceScore: caches.processed.data.reduce((sum, item) => sum + item.relevanceScore, 0) / caches.processed.data.length,
          regions: [...new Set(caches.processed.data.map(item => item.region))],
          cached: true,
          lastUpdated: new Date(caches.processed.timestamp).toISOString()
        },
        type: "news"
      });
    }

    // Get processed articles (will use cache if available)
    let items = await processAndFilterArticles(region || null);
    
    // Apply additional filters
    if (keyword) {
      items = filterByKeyword(items, keyword);
    }
    
    if (minRelevanceScore > 0) {
      items = items.filter(item => item.relevanceScore >= minRelevanceScore);
    }
    
    // Cache the processed results if not filtered
    if (!region && !keyword && minRelevanceScore <= 2) {
      caches.processed = { 
        data: items, 
        timestamp: Date.now(), 
        ttl: 5 * 60 * 1000 
      };
    }
    
    const paginationResult = paginateAdvanced(items, pageNum, limitNum);

    // Add source distribution info
    const sourceDistribution = {};
    items.forEach(item => {
      sourceDistribution[item.source] = (sourceDistribution[item.source] || 0) + 1;
    });

    res.json({
      ...paginationResult,
      metadata: {
        sourceDistribution,
        averageRelevanceScore: items.reduce((sum, item) => sum + item.relevanceScore, 0) / items.length,
        regions: [...new Set(items.map(item => item.region))],
        cached: false,
        lastUpdated: new Date().toISOString()
      },
      type: "news"
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ 
      error: "Failed to fetch news", 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Events request handler
async function handleEventsRequest(req, res) {
  try {
    if (isCacheValid(caches.events)) {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      
      const paginationResult = paginateAdvanced(caches.events.data, pageNum, limitNum);
      
      return res.json({
        ...paginationResult,
        cached: true,
        lastUpdated: new Date(caches.events.timestamp).toISOString(),
        type: "events"
      });
    }
    
    const events = await fetchEventsFromSources();
    caches.events = { data: events, timestamp: Date.now(), ttl: 30 * 60 * 1000 };
    
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    const paginationResult = paginateAdvanced(events, pageNum, limitNum);
    
    res.json({
      ...paginationResult,
      cached: false,
      lastUpdated: new Date(caches.events.timestamp).toISOString(),
      type: "events"
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    res.status(500).json({
      error: "Failed to fetch events: " + error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Debug endpoint
router.get("/debug", async (req, res) => {
  try {
    const apiKeys = {
      GNEWS_API_KEY: !!process.env.GNEWS_API_KEY,
      EVENTBRITE_API_KEY: !!process.env.EVENTBRITE_API_KEY,
      TICKETMASTER_API_KEY: !!process.env.TICKETMASTER_API_KEY
    };

    // Test primary sources
    const primarySourcesStatus = {};
    
    // Test ReliefWeb
    try {
      const reliefWebResp = await fetchWithRetry(
        `https://api.reliefweb.int/v1/reports?appname=juaclima&query[value]=climate&limit=5&sort[]=date:desc&fields[]=title`,
        { timeout: 5000 }
      );
      primarySourcesStatus.ReliefWeb = {
        status: "success",
        itemCount: reliefWebResp.data?.data?.length || 0
      };
    } catch (error) {
      primarySourcesStatus.ReliefWeb = {
        status: "error",
        error: error.message
      };
    }

    // Test RSS feeds
    const rssFeeds = [
      { name: 'CarbonBrief', url: 'https://www.carbonbrief.org/feed/' },
      { name: 'NASA Climate', url: 'https://climate.nasa.gov/news/feed/' },
      { name: 'UN Climate News', url: 'https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml' }
    ];

    for (const feed of rssFeeds) {
      try {
        const result = await parser.parseURL(feed.url);
        primarySourcesStatus[feed.name] = {
          status: "success",
          itemCount: result.items?.length || 0
        };
      } catch (error) {
        primarySourcesStatus[feed.name] = {
          status: "error",
          error: error.message
        };
      }
    }

    // Test secondary sources (GNews)
    let secondarySourceStatus = { status: "not_configured" };
    if (process.env.GNEWS_API_KEY) {
      try {
        const gnewsResp = await fetchWithRetry(
          `https://gnews.io/api/v4/search?q=climate&token=${process.env.GNEWS_API_KEY}&max=1`,
          { timeout: 5000 }
        );
        secondarySourceStatus = {
          status: "success",
          itemCount: gnewsResp.data?.articles?.length || 0
        };
      } catch (error) {
        secondarySourceStatus = {
          status: "error",
          error: error.message
        };
      }
    }

    // Test events sources
    const eventsStatus = {};
    try {
      const events = await fetchEventsFromSources();
      eventsStatus.overall = {
        status: "success",
        itemCount: events.length
      };
    } catch (error) {
      eventsStatus.overall = {
        status: "error",
        error: error.message
      };
    }

    const cacheInfo = {
      primary: { 
        count: caches.primary.data.length, 
        age: caches.primary.timestamp ? Date.now() - caches.primary.timestamp : null,
        ageMinutes: caches.primary.timestamp ? Math.round((Date.now() - caches.primary.timestamp) / 60000) : null,
        valid: isCacheValid(caches.primary)
      },
      secondary: { 
        count: caches.secondary.data.length, 
        age: caches.secondary.timestamp ? Date.now() - caches.secondary.timestamp : null,
        ageMinutes: caches.secondary.timestamp ? Math.round((Date.now() - caches.secondary.timestamp) / 60000) : null,
        valid: isCacheValid(caches.secondary)
      },
      processed: { 
        count: caches.processed.data.length, 
        age: caches.processed.timestamp ? Date.now() - caches.processed.timestamp : null,
        ageMinutes: caches.processed.timestamp ? Math.round((Date.now() - caches.processed.timestamp) / 60000) : null,
        valid: isCacheValid(caches.processed)
      },
      events: {
        count: caches.events.data.length,
        age: caches.events.timestamp ? Date.now() - caches.events.timestamp : null,
        ageMinutes: caches.events.timestamp ? Math.round((Date.now() - caches.events.timestamp) / 60000) : null,
        valid: isCacheValid(caches.events)
      }
    };

    res.json({
      status: "debug_info",
      timestamp: new Date().toISOString(),
      apiKeys,
      sources: {
        primary: primarySourcesStatus,
        secondary: secondarySourceStatus,
        events: eventsStatus
      },
      cache: cacheInfo,
      configuration: {
        PRIMARY_TTL_MINUTES: caches.primary.ttl / 60000,
        SECONDARY_TTL_MINUTES: caches.secondary.ttl / 60000,
        PROCESSED_TTL_MINUTES: caches.processed.ttl / 60000,
        EVENTS_TTL_MINUTES: caches.events.ttl / 60000,
        RELEVANCE_THRESHOLD: 2
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT || "not_set"
      }
    });

  } catch (error) {
    res.status(500).json({
      error: "Debug endpoint failed",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management endpoint
router.post("/cache/refresh", async (req, res) => {
  try {
    const { source = "all", prewarm = false } = req.body;
    
    if (source === "all" || source === "primary") {
      caches.primary = { data: [], timestamp: 0, ttl: 15 * 60 * 1000 };
      console.log("Primary source cache cleared");
    }
    
    if (source === "all" || source === "secondary") {
      caches.secondary = { data: [], timestamp: 0, ttl: 10 * 60 * 1000 };
      console.log("Secondary source cache cleared");
    }
    
    if (source === "all" || source === "processed") {
      caches.processed = { data: [], timestamp: 0, ttl: 5 * 60 * 1000 };
      console.log("Processed news cache cleared");
    }
    
    if (source === "all" || source === "events") {
      caches.events = { data: [], timestamp: 0, ttl: 30 * 60 * 1000 };
      console.log("Events cache cleared");
    }

    // Pre-warm caches if requested
    if (prewarm) {
      console.log("Pre-warming caches...");
      try {
        await Promise.all([
          (async () => {
            const primaryArticles = await fetchPrimarySources();
            caches.primary = { data: primaryArticles, timestamp: Date.now(), ttl: 15 * 60 * 1000 };
          })(),
          (async () => {
            const secondaryArticles = await fetchSecondarySources();
            caches.secondary = { data: secondaryArticles, timestamp: Date.now(), ttl: 10 * 60 * 1000 };
          })(),
          (async () => {
            const processedArticles = await processAndFilterArticles();
            caches.processed = { data: processedArticles, timestamp: Date.now(), ttl: 5 * 60 * 1000 };
          })(),
          (async () => {
            const events = await fetchEventsFromSources();
            caches.events = { data: events, timestamp: Date.now(), ttl: 30 * 60 * 1000 };
          })()
        ]);
        console.log("Caches pre-warmed successfully");
      } catch (prewarmError) {
        console.error("Pre-warming failed:", prewarmError);
      }
    }

    res.json({
      success: true,
      message: `Cache refreshed for: ${source}`,
      prewarmed: prewarm,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to refresh cache",
      details: error.message
    });
  }
});

// Search suggestions endpoint
router.get("/suggestions", async (req, res) => {
  try {
    const { query = "", type = "keywords" } = req.query;
    
    if (type === "regions") {
      const regions = Object.keys(REGION_MAPPING);
      const filtered = query 
        ? regions.filter(region => region.toLowerCase().includes(query.toLowerCase()))
        : regions;
      
      return res.json({
        suggestions: filtered.slice(0, 10),
        type: "regions"
      });
    }

    if (type === "keywords") {
      const allKeywords = CLIMATE_KEYWORDS;
      
      const filtered = query
        ? allKeywords.filter(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
        : allKeywords.slice(0, 20);
      
      return res.json({
        suggestions: filtered.slice(0, 10),
        type: "keywords"
      });
    }

    // Default: return both
    res.json({
      regions: Object.keys(REGION_MAPPING).slice(0, 5),
      keywords: CLIMATE_KEYWORDS.slice(0, 5),
      type: "mixed"
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to get suggestions",
      details: error.message
    });
  }
});

// Source quality metrics endpoint
router.get("/sources", async (req, res) => {
  try {
    // Get recent articles to analyze source performance
    let articles = [];
    if (isCacheValid(caches.processed)) {
      articles = caches.processed.data;
    } else {
      articles = await processAndFilterArticles();
    }
    
    const recentArticles = articles.filter(article => {
      const articleDate = new Date(article.publishedAt);
      const daysSince = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7; // Last 7 days
    });

    const sourceMetrics = {};

    recentArticles.forEach(article => {
      if (!sourceMetrics[article.source]) {
        sourceMetrics[article.source] = {
          totalArticles: 0,
          averageRelevance: 0,
          relevanceSum: 0,
          sourceType: article.sourceType,
          regions: new Set(),
          latestArticle: null
        };
      }

      const metrics = sourceMetrics[article.source];
      metrics.totalArticles++;
      metrics.relevanceSum += article.relevanceScore || 0;
      metrics.averageRelevance = metrics.relevanceSum / metrics.totalArticles;
      metrics.regions.add(article.region);
      
      if (!metrics.latestArticle || 
          new Date(article.publishedAt) > new Date(metrics.latestArticle)) {
        metrics.latestArticle = article.publishedAt;
      }
    });

    // Convert Set to Array for JSON serialization
    Object.values(sourceMetrics).forEach(metrics => {
      metrics.regions = Array.from(metrics.regions);
    });

    // Calculate source rankings
    const rankedSources = Object.entries(sourceMetrics)
      .map(([source, metrics]) => ({
        source,
        ...metrics,
        qualityScore: (metrics.averageRelevance * 0.6) + 
                     (Math.min(metrics.totalArticles / 10, 1) * 0.4) // Volume bonus up to 10 articles
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);

    res.json({
      sources: rankedSources,
      summary: {
        totalSources: rankedSources.length,
        primarySources: rankedSources.filter(s => s.sourceType === 'primary').length,
        secondarySources: rankedSources.filter(s => s.sourceType === 'secondary').length,
        averageQuality: rankedSources.reduce((sum, s) => sum + s.qualityScore, 0) / rankedSources.length,
        topPerformers: rankedSources.slice(0, 3).map(s => s.source)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to get source metrics",
      details: error.message
    });
  }
});

// Analytics endpoint
router.get("/analytics", async (req, res) => {
  try {
    const { region = null, days = 7 } = req.query;
    
    let articles = [];
    if (isCacheValid(caches.processed) && !region) {
      articles = caches.processed.data;
    } else {
      articles = await processAndFilterArticles(region);
    }
    
    const now = Date.now();
    const timeThreshold = now - (parseInt(days) * 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter(article => 
      new Date(article.publishedAt).getTime() > timeThreshold
    );

    const analytics = {
      totalArticles: articles.length,
      recentArticles: recentArticles.length,
      averageRelevanceScore: articles.reduce((sum, a) => sum + (a.relevanceScore || 0), 0) / articles.length,
      sourceBreakdown: {},
      regionBreakdown: {},
      topKeywords: getTopKeywords(articles),
      trendingTopics: getTrendingTopics(recentArticles),
      dailyVolume: getDailyVolume(recentArticles, parseInt(days))
    };

    // Source breakdown
    articles.forEach(article => {
      analytics.sourceBreakdown[article.source] = 
        (analytics.sourceBreakdown[article.source] || 0) + 1;
    });

    // Region breakdown  
    articles.forEach(article => {
      analytics.regionBreakdown[article.region] = 
        (analytics.regionBreakdown[article.region] || 0) + 1;
    });

    res.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
});

// Regions endpoint
router.get("/regions", (req, res) => {
  res.json({
    regions: Object.keys(REGION_MAPPING),
    countries: COUNTRY_TO_REGION,
    supported: Object.keys(REGION_MAPPING)
  });
});

// Health endpoint
router.get("/health", (req, res) => {
  const cacheStatus = {
    primary: {
      itemCount: caches.primary.data.length,
      lastUpdated: caches.primary.timestamp ? new Date(caches.primary.timestamp).toISOString() : null,
      valid: isCacheValid(caches.primary)
    },
    secondary: {
      itemCount: caches.secondary.data.length,
      lastUpdated: caches.secondary.timestamp ? new Date(caches.secondary.timestamp).toISOString() : null,
      valid: isCacheValid(caches.secondary)
    },
    processed: {
      itemCount: caches.processed.data.length,
      lastUpdated: caches.processed.timestamp ? new Date(caches.processed.timestamp).toISOString() : null,
      valid: isCacheValid(caches.processed)
    },
    events: {
      itemCount: caches.events.data.length,
      lastUpdated: caches.events.timestamp ? new Date(caches.events.timestamp).toISOString() : null,
      valid: isCacheValid(caches.events)
    }
  };

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cacheStatus,
    version: "1.0.0"
  });
});

export default router;