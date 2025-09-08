import axios from "axios";

// --- Constants ---
export const REGION_MAPPING = {
  africa: ["KE", "NG", "ZA", "EG", "GH", "TZ", "UG", "ET", "MA", "DZ", "SD", "AO", "CI", "CM", "SN", "ZW", "MZ", "RW", "SO", "BF", "NE", "ML", "ZM", "MW", "TG", "LS", "GM", "BI", "SL", "LR", "DJ", "SZ", "MR", "GA", "GQ", "BW", "CV", "ST", "SC", "KM"],
  europe: ["GB", "FR", "DE", "IT", "ES", "RU", "UA", "PL", "RO", "NL", "BE", "GR", "CZ", "PT", "SE", "HU", "AT", "CH", "BG", "DK", "FI", "SK", "NO", "IE", "HR", "LT", "SI", "LV", "EE", "LU", "CY", "MT", "IS", "LI", "MC", "AD", "SM", "VA"],
  asia: ["CN", "IN", "ID", "PK", "BD", "JP", "PH", "VN", "TR", "IR", "TH", "MM", "KR", "IQ", "AF", "SA", "UZ", "MY", "YE", "NP", "KZ", "SY", "KH", "JO", "AE", "AZ", "TJ", "IL", "HK", "LA", "KG", "LB", "TM", "SG", "OM", "KW", "GE", "MN", "AM", "QA", "BH", "MV", "BT", "MO"],
  americas: ["US", "CA", "BR", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "JM", "TT", "BS", "BZ", "HT", "GY", "SR", "KN", "LC", "VC", "AG", "DM", "GD", "BB", "SX"],
  oceania: ["AU", "NZ", "PG", "FJ", "SB", "VU", "NC", "WS", "TO", "TV", "FM", "MH", "PW", "KI", "NR"]
};

export const COUNTRY_TO_REGION = Object.entries(REGION_MAPPING).reduce((acc, [region, countries]) => {
  countries.forEach(code => acc[code] = region);
  return acc;
}, {});

export const CLIMATE_KEYWORDS = [
  "climate", "weather", "rain", "drought", "flood", "storm", "heatwave", "cyclone", "hurricane", "typhoon",
  "wildfire", "temperature", "precipitation", "greenhouse", "carbon", "emissions", "global warming", "sea level",
  "adaptation", "mitigation", "resilience", "disaster", "environment", "sustainability", "renewable", "solar", "wind"
];

// Add region keywords mapping for automatic region detection
export const REGION_KEYWORDS = {
  africa: ['africa', 'kenya', 'nigeria', 'south africa', 'ethiopia', 'egypt', 'ghana', 'tanzania', 'uganda', 'morocco', 'algeria'],
  europe: ['europe', 'eu ', 'uk ', 'germany', 'france', 'spain', 'italy', 'russia', 'ukraine', 'poland', 'netherlands', 'sweden'],
  asia: ['asia', 'china', 'india', 'japan', 'korea', 'indonesia', 'pakistan', 'bangladesh', 'vietnam', 'turkey', 'iran', 'thailand'],
  americas: ['america', 'usa', 'us ', 'canada', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru'],
  oceania: ['australia', 'new zealand', 'pacific', 'oceania', 'papua new guinea', 'fiji', 'solomon islands']
};

// --- Utility Functions ---

// Cache validation helper
export function isCacheValid(cache) {
  return cache.data && cache.data.length > 0 && (Date.now() - cache.timestamp < cache.ttl);
}

// Retry mechanism for API calls
export async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 5000, ...options });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export function calculateRelevanceScore(article) {
  let score = 0;
  if (!article) return score;
  const text = `${article.title || ""} ${article.description || ""} ${article.content || ""}`.toLowerCase();
  CLIMATE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  if (article.region) score += 2;
  if (article.country) score += 1;
  if (article.sourceType === "primary") score += 2;
  return score;
}

export function normalizeReliefWebPublication(pub) {
  const region = getRegion(pub);
  return {
    id: pub.id,
    title: pub.fields?.title || pub.title,
    description: pub.fields?.body || pub.description,
    url: pub.fields?.url || pub.url,
    publishedAt: pub.fields?.date?.created || pub.date?.created || pub.date || new Date().toISOString(),
    source: "ReliefWeb",
    sourceType: "primary",
    country: pub.fields?.country?.[0]?.iso3 || pub.country?.[0]?.iso3 || null,
    region: region,
    relevanceScore: calculateRelevanceScore(pub)
  };
}

export function normalizeRSSItem(item, sourceName, sourceType = "secondary") {
  const region = getRegion(item);
  return {
    id: item.guid || item.link,
    title: item.title,
    description: item.contentSnippet || item.description,
    url: item.link,
    publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
    source: sourceName,
    sourceType,
    region: region,
    relevanceScore: calculateRelevanceScore(item)
  };
}

export async function safeParseRSS(url, sourceName) {
  try {
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
      timeout: 5000,
      customFields: {
        item: ['media:content', 'media:thumbnail']
      }
    });
    const feed = await parser.parseURL(url);
    return feed.items.map(item => normalizeRSSItem(item, sourceName));
  } catch (err) {
    console.warn(`RSS parsing failed for ${sourceName}:`, err.message);
    return [];
  }
}

export function normalizeGNewsArticle(article) {
  const region = getRegion(article);
  return {
    id: article.url,
    title: article.title,
    description: article.description,
    url: article.url,
    publishedAt: article.publishedAt,
    source: article.source?.name || "GNews",
    sourceType: "primary",
    country: article.country || null,
    region: region,
    relevanceScore: calculateRelevanceScore(article)
  };
}

export function normalizeEventbriteEvent(event) {
  const region = getRegion(event);
  return {
    id: event.id,
    title: event.name?.text,
    description: event.description?.text,
    url: event.url,
    start: event.start?.local,
    end: event.end?.local,
    source: "Eventbrite",
    sourceType: "event",
    country: event.venue?.address?.country_code || null,
    region: region,
    relevanceScore: calculateRelevanceScore(event)
  };
}

export function getRegion(item) {
  // If region is already provided, use it
  if (item.region) return item.region;
  
  // If country is provided, map to region
  if (item.country && COUNTRY_TO_REGION[item.country]) {
    return COUNTRY_TO_REGION[item.country];
  }
  
  // Try to extract region from venue country for events
  if (item.venue?.address?.country_code && COUNTRY_TO_REGION[item.venue.address.country_code]) {
    return COUNTRY_TO_REGION[item.venue.address.country_code];
  }
  
  // Try to extract region from content using keywords
  const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return region;
    }
  }
  
  return 'global'; // Default region
}

export function deduplicateAdvanced(articles) {
  const seen = new Map();
  return articles.filter(article => {
    // Create a unique key based on title and source
    const key = (article.title || "").toLowerCase().trim() + "|" + (article.source || "");
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}

export function filterByKeyword(items, keyword) {
  if (!keyword) return items;
  const lowerKeyword = keyword.toLowerCase();
  return items.filter(item =>
    (item.title && item.title.toLowerCase().includes(lowerKeyword)) ||
    (item.description && item.description.toLowerCase().includes(lowerKeyword)) ||
    (item.content && item.content.toLowerCase().includes(lowerKeyword))
  );
}

export function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    hasMore: end < items.length
  };
}

// Enhanced pagination with metadata
export function paginateAdvanced(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    items: items.slice(start, end),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    hasMore: end < total
  };
}

export function getTopKeywords(articles, topN = 10) {
  const freq = {};
  articles.forEach(article => {
    CLIMATE_KEYWORDS.forEach(keyword => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      if (text.includes(keyword)) {
        freq[keyword] = (freq[keyword] || 0) + 1;
      }
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword, count]) => ({ keyword, count }));
}

export function getTrendingTopics(articles, topN = 5) {
  const topics = {};
  const commonWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'are', 'from', 'has', 'have']);
  
  articles.forEach(article => {
    if (article.title) {
      const words = article.title.toLowerCase().split(/\W+/);
      words.forEach(word => {
        if (word.length > 4 && !commonWords.has(word) && !CLIMATE_KEYWORDS.includes(word)) {
          topics[word] = (topics[word] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([topic, count]) => ({ topic, count }));
}

export function getDailyVolume(articles, days = 7) {
  const daily = {};
  const now = new Date();
  
  // Initialize with empty values for the last 'days' days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    daily[dateStr] = 0;
  }
  
  // Count articles per day
  articles.forEach(article => {
    const date = new Date(article.publishedAt || article.start || now).toISOString().slice(0, 10);
    if (daily[date] !== undefined) {
      daily[date]++;
    }
  });
  
  return daily;
}

// Primary sources fetcher
export async function fetchPrimarySources() {
  const articles = [];
  
  // ReliefWeb - using the correct API format
  try {
    const reliefResp = await fetchWithRetry(
      "https://api.reliefweb.int/v1/reports?appname=climate-news&query[value]=climate&limit=20&fields[include][]=title&fields[include][]=body&fields[include][]=url&fields[include][]=date&fields[include][]=country"
    );
    
    if (reliefResp.data && reliefResp.data.data) {
      articles.push(...reliefResp.data.data.map(normalizeReliefWebPublication));
    }
  } catch (err) {
    console.warn("ReliefWeb fetch failed:", err.message);
  }
  
  // RSS feeds
  const rssFeeds = [
    { url: "https://unfccc.int/rss.xml", name: "UNFCCC" },
    { url: "https://www.carbonbrief.org/feed/", name: "CarbonBrief" },
    { url: "https://climate.nasa.gov/news/feed/", name: "NASA Climate" },
    { url: "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml", name: "UN Climate News" }
  ];
  
  for (const feed of rssFeeds) {
    try {
      const rssArticles = await safeParseRSS(feed.url, feed.name);
      articles.push(...rssArticles);
    } catch (err) {
      console.warn(`RSS feed ${feed.name} failed:`, err.message);
    }
  }
  
  return deduplicateAdvanced(articles);
}

// Secondary sources fetcher
export async function fetchSecondarySources() {
  const articles = [];
  
  // GNews
  if (process.env.GNEWS_API_KEY) {
    try {
      const gnewsResp = await fetchWithRetry(
        `https://gnews.io/api/v4/search?q=climate&token=${process.env.GNEWS_API_KEY}&lang=en&max=20`
      );
      if (gnewsResp.data && gnewsResp.data.articles) {
        articles.push(...gnewsResp.data.articles.map(normalizeGNewsArticle));
      }
    } catch (err) {
      console.warn("GNews fetch failed:", err.message);
    }
  }
  
  return deduplicateAdvanced(articles);
}

// Events fetcher
export async function fetchEventsFromSources() {
  const events = [];
  
  // Eventbrite
  if (process.env.EVENTBRITE_API_KEY) {
    try {
      const resp = await fetchWithRetry(
        `https://www.eventbriteapi.com/v3/events/search/?q=climate&token=${process.env.EVENTBRITE_API_KEY}`,
        { timeout: 5000 }
      );
      if (resp.data && resp.data.events) {
        events.push(...resp.data.events.map(normalizeEventbriteEvent));
      }
    } catch (err) {
      console.warn("Eventbrite fetch failed:", err.message);
    }
  }
  
  // Add other event sources here (Ticketmaster, etc.)
  // if (process.env.TICKETMASTER_API_KEY) { ... }
  
  return deduplicateAdvanced(events);
}

// Main processing function
export async function processAndFilterArticles(region = null, keyword = null) {
  let articles = [];
  
  // Fetch from all sources
  try {
    const [primaryArticles, secondaryArticles] = await Promise.all([
      fetchPrimarySources(),
      fetchSecondarySources()
    ]);
    
    articles = [...primaryArticles, ...secondaryArticles];
  } catch (error) {
    console.error("Error fetching articles:", error);
    // Return empty array rather than failing completely
    return [];
  }
  
  // Filtering
  if (region) {
    articles = articles.filter(a => a.region === region);
  }
  
  if (keyword) {
    articles = filterByKeyword(articles, keyword);
  }
  
  // Calculate relevance scores if not already set
  articles.forEach(article => {
    if (article.relevanceScore === undefined) {
      article.relevanceScore = calculateRelevanceScore(article);
    }
  });
  
  // Final deduplication and sort by relevance
  articles = deduplicateAdvanced(articles);
  articles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  
  return articles;
}

// Create search index for efficient filtering
export function createSearchIndex(articles) {
  const index = {
    byRegion: new Map(),
    byKeyword: new Map(),
    byDate: new Map(),
    bySource: new Map()
  };
  
  articles.forEach(article => {
    // Index by region
    const region = article.region || 'global';
    if (!index.byRegion.has(region)) index.byRegion.set(region, []);
    index.byRegion.get(region).push(article);
    
    // Index by keywords
    CLIMATE_KEYWORDS.forEach(keyword => {
      if (!index.byKeyword.has(keyword)) index.byKeyword.set(keyword, []);
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      if (text.includes(keyword)) {
        index.byKeyword.get(keyword).push(article);
      }
    });
    
    // Index by date (group by day)
    if (article.publishedAt) {
      const dateKey = new Date(article.publishedAt).toISOString().slice(0, 10);
      if (!index.byDate.has(dateKey)) index.byDate.set(dateKey, []);
      index.byDate.get(dateKey).push(article);
    }
    
    // Index by source
    if (article.source) {
      if (!index.bySource.has(article.source)) index.bySource.set(article.source, []);
      index.bySource.get(article.source).push(article);
    }
  });
  
  return index;
}