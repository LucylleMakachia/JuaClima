import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertCircle, ExternalLink, Globe } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CLIMATE_KEYWORDS = [
  "climate", "weather", "global warming", "climate change",
  "flood", "drought", "storm", "hurricane", "wildfire", "heatwave",
  "temperature", "precipitation", "carbon", "emissions", "renewable",
  "extreme weather", "sea level", "ice melt", "climate crisis",
  "climat", "météo", "réchauffement climatique", "changement climatique",
  "catastrophe", "inondation", "sécheresse", "tempête", "ouragan", "feu de forêt",
  "température", "précipitation",
  "clima", "tiempo", "medio ambiente", "calentamiento global", "cambio climático",
  "desastre", "inundación", "sequía", "tormenta", "huracán", "incendio forestal",
  "temperatura", "precipitación",
  "hali ya hewa", "mazingira", "mabadiliko ya tabianchi", "mafuriko", "ukame",
  "janga", "dutu", "moto wa porini", "hali ya hewa kali"
];

const REGION_MAPPING = {
  'US': 'North America', 'USA': 'North America', 'United States': 'North America',
  'CA': 'North America', 'Canada': 'North America',
  'MX': 'North America', 'Mexico': 'North America',
  'GB': 'Europe', 'UK': 'Europe', 'United Kingdom': 'Europe',
  'FR': 'Europe', 'France': 'Europe',
  'DE': 'Europe', 'Germany': 'Europe',
  'IT': 'Europe', 'Italy': 'Europe',
  'ES': 'Europe', 'Spain': 'Europe',
  'NL': 'Europe', 'Netherlands': 'Europe',
  'BE': 'Europe', 'Belgium': 'Europe',
  'CH': 'Europe', 'Switzerland': 'Europe',
  'AT': 'Europe', 'Austria': 'Europe',
  'SE': 'Europe', 'Sweden': 'Europe',
  'NO': 'Europe', 'Norway': 'Europe',
  'DK': 'Europe', 'Denmark': 'Europe',
  'FI': 'Europe', 'Finland': 'Europe',
  'CN': 'Asia', 'China': 'Asia',
  'IN': 'Asia', 'India': 'Asia',
  'JP': 'Asia', 'Japan': 'Asia',
  'KR': 'Asia', 'South Korea': 'Asia',
  'TH': 'Asia', 'Thailand': 'Asia',
  'SG': 'Asia', 'Singapore': 'Asia',
  'MY': 'Asia', 'Malaysia': 'Asia',
  'ID': 'Asia', 'Indonesia': 'Asia',
  'PH': 'Asia', 'Philippines': 'Asia',
  'VN': 'Asia', 'Vietnam': 'Asia',
  'ZA': 'Africa', 'South Africa': 'Africa',
  'NG': 'Africa', 'Nigeria': 'Africa',
  'EG': 'Africa', 'Egypt': 'Africa',
  'KE': 'Africa', 'Kenya': 'Africa',
  'GH': 'Africa', 'Ghana': 'Africa',
  'MA': 'Africa', 'Morocco': 'Africa',
  'TZ': 'Africa', 'Tanzania': 'Africa',
  'UG': 'Africa', 'Uganda': 'Africa',
  'ET': 'Africa', 'Ethiopia': 'Africa',
  'RW': 'Africa', 'Rwanda': 'Africa',
  'AU': 'Oceania', 'Australia': 'Oceania',
  'NZ': 'Oceania', 'New Zealand': 'Oceania',
  'BR': 'South America', 'Brazil': 'South America',
  'AR': 'South America', 'Argentina': 'South America',
  'CL': 'South America', 'Chile': 'South America',
  'CO': 'South America', 'Colombia': 'South America',
  'PE': 'South America', 'Peru': 'South America',
  'VE': 'South America', 'Venezuela': 'South America',
};

const ALLOWED_REGIONS = [
  "Africa", "Europe", "Asia", "North America", "South America", "Antarctica", "Australia"
];

const normalizeText = (text) => text?.toLowerCase().trim() || "";

const getRegion = (item) => {
  if (item.country) return REGION_MAPPING[item.country] || item.country;
  if (item.source) {
    const sourceName = typeof item.source === "string" ? item.source : item.source?.name || "";
    const sourceText = sourceName.toLowerCase();
    for (const [key, region] of Object.entries(REGION_MAPPING)) {
      if (sourceText.includes(key.toLowerCase())) return region;
    }
  }
  return "Global";
};

const sortByDate = (items) =>
  [...items].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.date || a.created_at || 0);
    const dateB = new Date(b.publishedAt || b.date || b.created_at || 0);
    return dateB - dateA;
  });

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  } catch {
    return "Unknown";
  }
};

const INITIAL_VISIBLE = 5;

export default function NewsEvents() {
  const [newsByRegion, setNewsByRegion] = useState({});
  const [eventsByRegion, setEventsByRegion] = useState({});
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorNews, setErrorNews] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);
  const [lastUpdatedNews, setLastUpdatedNews] = useState(null);
  const [lastUpdatedEvents, setLastUpdatedEvents] = useState(null);
  const [itemsToShowNews, setItemsToShowNews] = useState({});
  const [itemsToShowEvents, setItemsToShowEvents] = useState({});

  const deduplicateItems = useCallback((items) => {
    const map = new Map();
    items.forEach(item => {
      const url = item.url;
      if (url && !map.has(url)) map.set(url, item);
    });
    return Array.from(map.values());
  }, []);

  const filterAndLimitRegions = useCallback((grouped, limit = INITIAL_VISIBLE) => {
    const filtered = {};
    ALLOWED_REGIONS.forEach(region => {
      if (grouped[region]) filtered[region] = grouped[region].slice(0, limit);
    });
    return filtered;
  }, []);

  const filterClimateNews = (data) => {
    return data.filter(item => {
      if (!item.title) return false;
      const text = normalizeText(`${item.title} ${item.description || ""} ${item.content || ""}`);
      return CLIMATE_KEYWORDS.some(keyword => {
        const k = normalizeText(keyword);
        const regex = new RegExp(`\\b${k}\\b`, 'i');
        return regex.test(text);
      });
    });
  };

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const res = await fetch("/api/news/news", {credentials: "include"});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to fetch news");
      }
      const { data } = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid news response format");

      const filtered = filterClimateNews(data);
      if (!filtered.length) {
        setErrorNews("No climate-related news found.");
        setNewsByRegion({});
        return;
      }

      const uniqueItems = deduplicateItems(filtered);
      const sortedItems = sortByDate(uniqueItems);
      const grouped = sortedItems.reduce((acc, item) => {
        let region = getRegion(item);
        const combinedText = [item.country, item.source, item.title, item.url].filter(Boolean).join(" ").toLowerCase();
        if (combinedText.includes("kenya")) region = "Kenya";
        if (!acc[region]) acc[region] = [];
        acc[region].push(item);
        return acc;
      }, {});
      Object.keys(grouped).forEach(region => grouped[region] = sortByDate(grouped[region]));
      const prioritized = filterAndLimitRegions(grouped, 15);
      setNewsByRegion(prioritized);
      const initialCounts = {};
      Object.keys(prioritized).forEach(r => initialCounts[r] = INITIAL_VISIBLE);
      setItemsToShowNews(initialCounts);
      setLastUpdatedNews(new Date());
    } catch (err) {
      setErrorNews(err.message || "Failed to load news.");
      setNewsByRegion({});
      setItemsToShowNews({});
    } finally {
      setLoadingNews(false);
    }
  }, [deduplicateItems, filterAndLimitRegions]);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    setErrorEvents(null);
    try {
      const res = await fetch("/api/news/events", {credentials: "include"});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch events");
      }
      const { data } = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid events response format");

      const filtered = data.filter(item => {
        if (!item.name && !item.title) return false;
        const text = normalizeText(`${item.name || item.title} ${item.description || ""} ${item.summary || ""}`);
        return CLIMATE_KEYWORDS.some(k => {
          const keyNorm = normalizeText(k);
          const regex = new RegExp(`\\b${keyNorm}\\b`, 'i');
          return regex.test(text);
        });
      });

      if (!filtered.length) {
        setErrorEvents("No climate-related events found.");
        setEventsByRegion({});
        return;
      }

      const normalizedEvents = filtered.map(event => ({
        ...event,
        title: event.name || event.title,
        date: event.start?.local || event.date || event.created_at,
        publishedAt: event.start?.local || event.date || event.created_at,
        venue: event.venue || null,
        organizer: event.organizer || null,
        ticket_availability: event.ticket_availability || null,
      }));

      const uniqueItems = deduplicateItems(normalizedEvents);
      const sortedItems = sortByDate(uniqueItems);
      const grouped = sortedItems.reduce((acc, item) => {
        let region = getRegion(item);
        const combinedText = [item.country, item.source, item.title, item.url, item.venue].filter(Boolean).join(" ").toLowerCase();
        if (combinedText.includes("kenya")) region = "Kenya";
        if (!acc[region]) acc[region] = [];
        acc[region].push(item);
        return acc;
      }, {});
      Object.keys(grouped).forEach(region => grouped[region] = sortByDate(grouped[region]));
      const prioritized = filterAndLimitRegions(grouped, 15);
      setEventsByRegion(prioritized);
      const initialCounts = {};
      Object.keys(prioritized).forEach(r => initialCounts[r] = INITIAL_VISIBLE);
      setItemsToShowEvents(initialCounts);
      setLastUpdatedEvents(new Date());
    } catch (err) {
      setErrorEvents(err.message || "Failed to load events.");
      setEventsByRegion({});
      setItemsToShowEvents({});
    } finally {
      setLoadingEvents(false);
    }
  }, [deduplicateItems, filterAndLimitRegions]);

  useEffect(() => {
    fetchNews();
    fetchEvents();
  }, [fetchNews, fetchEvents]);

  const handleLoadMoreNews = useCallback(region => {
    setItemsToShowNews(prev => ({
      ...prev,
      [region]: (prev[region] || INITIAL_VISIBLE) + 5,
    }));
  }, []);

  const handleLoadMoreEvents = useCallback(region => {
    setItemsToShowEvents(prev => ({
      ...prev,
      [region]: (prev[region] || INITIAL_VISIBLE) + 5,
    }));
  }, []);

  const sidebarStyle = {
    height: "100vh",
    maxHeight: "100vh",
    padding: "1rem",
    boxSizing: "border-box",
    backgroundColor: "transparent",
    borderRadius: "0.5rem",
    overflowY: "auto",
    overflowX: "hidden",
    width: "400px",
    maxWidth: "100%",
    border: "none",
    boxShadow: "none",
  };

  const containerStyle = {
    backgroundColor: "transparent",
    boxShadow: "none",
    border: "none",
  };

  const itemBoxStyle = {
    display: "block",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#1f2937",
    textDecoration: "none",
    maxWidth: "100%",
    boxShadow: "none",
    overflowX: "hidden",
  };

  return (
    <aside style={sidebarStyle} role="region" aria-label="Climate news and events sidebar">
      <div style={{ ...containerStyle, marginBottom: 32, borderBottom: "1px solid #d1d5db", paddingBottom: 24, borderColor: "#4b5563" }}>
        <div style={{ ...containerStyle, display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Climate News</h3>
          <button
            onClick={fetchNews}
            disabled={loadingNews}
            aria-pressed="false"
            aria-label="Refresh Climate News"
            title="Refresh News"
            style={{
              padding: 6,
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: loadingNews ? 'default' : 'pointer',
              opacity: loadingNews ? 0.5 : 1,
              transition: "background-color 0.3s",
            }}
          >
            <RefreshCw
              style={{ width: 16, height: 16, color: "#4b5563", animation: loadingNews ? "spin 1s linear infinite" : "none" }}
            />
          </button>
        </div>
        {lastUpdatedNews && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Last updated: {lastUpdatedNews.toLocaleTimeString()}
          </p>
        )}
        {loadingNews
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Skeleton height={50} />
              </div>
            ))
          : errorNews ? (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                color: "#991b1b",
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <AlertCircle style={{ width: 16, height: 16, marginRight: 8, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: "600", marginBottom: 4 }}>Unable to load news</p>
                  <p style={{ fontSize: 12, marginBottom: 8 }}>{errorNews}</p>
                  <button
                    onClick={fetchNews}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#b91c1c",
                      color: "white",
                      fontSize: 12,
                      borderRadius: 4,
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            Object.entries(newsByRegion).map(([region, items]) => {
              const visibleCount = itemsToShowNews[region] || INITIAL_VISIBLE;
              const sortedItems = sortByDate(items);
              const visibleItems = sortedItems.slice(0, visibleCount);
              const hasMore = visibleCount < items.length;
              return (
                <section key={region} aria-label={`${region} climate news`} style={{ marginBottom: 16 }}>
                  <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "#111827" }}>{region}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {visibleItems.map((item, index) => (
                      <a
                        key={item.url || index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={itemBoxStyle}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ffffff"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h5 style={{ fontWeight: 500, fontSize: 14, marginRight: 8, cursor: 'pointer' }}>{item.title}</h5>
                          <ExternalLink style={{ width: 12, height: 12, color: "#9ca3af" }} />
                        </div>
                        {item.description && (
                          <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 12, lineHeight: "1.25" }}>
                            {item.description.length > 120 ? `${item.description.substring(0, 120)}...` : item.description}
                          </p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#2563eb" }}>
                          <span style={{ fontWeight: 500 }}>
                            {(typeof item.source === "string" ? item.source : item.source?.name || "Unknown Source").substring(0, 20)}
                            {typeof item.source === "string" && item.source.length > 20 && "..."}
                          </span>
                          <span style={{ color: "#6b7280" }}>{formatDate(item.publishedAt || item.date)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => handleLoadMoreNews(region)}
                      aria-label={`Load more news for ${region}`}
                      style={{ marginTop: 8, color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                    >
                      Load more...
                    </button>
                  )}
                </section>
              );
            })
          )
        }
      </div>

      <div style={containerStyle}>
        <div style={{ ...containerStyle, display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>Climate Events</h3>
          <button
            onClick={fetchEvents}
            disabled={loadingEvents}
            aria-pressed="false"
            aria-label="Refresh Climate Events"
            title="Refresh Events"
            style={{
              padding: 6,
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: loadingEvents ? 'default' : 'pointer',
              opacity: loadingEvents ? 0.5 : 1,
              transition: "background-color 0.3s",
            }}
          >
            <RefreshCw style={{ width: 16, height: 16, color: "#4b5563", animation: loadingEvents ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
        {lastUpdatedEvents && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Last updated: {lastUpdatedEvents.toLocaleTimeString()}
          </p>
        )}
        {loadingEvents
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Skeleton height={50} />
              </div>
            ))
          : errorEvents ? (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                color: "#991b1b",
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <AlertCircle style={{ width: 16, height: 16, marginRight: 8, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: "600", marginBottom: 4 }}>Unable to load events</p>
                  <p style={{ fontSize: 12, marginBottom: 8 }}>{errorEvents}</p>
                  <button
                    onClick={fetchEvents}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#b91c1c",
                      color: "white",
                      fontSize: 12,
                      borderRadius: 4,
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            Object.entries(eventsByRegion).map(([region, items]) => {
              const visibleCount = itemsToShowEvents[region] || INITIAL_VISIBLE;
              const sortedItems = sortByDate(items);
              const visibleItems = sortedItems.slice(0, visibleCount);
              const hasMore = visibleCount < items.length;
              return (
                <section key={region} aria-label={`${region} climate events`} style={{ marginBottom: 16 }}>
                  <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "#111827" }}>{region}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {visibleItems.map((item, index) => (
                      <div
                        key={item.url || index}
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          color: "#1f2937",
                          transition: "background-color 0.2s",
                          maxWidth: "100%",
                          boxShadow: "none",
                          overflowX: "hidden",
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ffffff"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h5 style={{ fontWeight: 500, fontSize: 14, marginRight: 8, cursor: "pointer" }}>
                            {item.title}
                          </h5>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink style={{ width: 12, height: 12, color: "#9ca3af" }} />
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 12, lineHeight: "1.25" }}>
                            {item.description.length > 120 ? `${item.description.substring(0, 120)}...` : item.description}
                          </p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#6b7280" }}>
                          {item.venue && (
                            <div style={{ display: "flex", alignItems: "start", gap: 4 }}>
                              <Globe style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />
                              <span>
                                {item.venue.name || "Event Venue"}
                                {item.venue.address?.localized_address_display && (
                                  <div style={{ color: "#9ca3af" }}>{item.venue.address.localized_address_display}</div>
                                )}
                              </span>
                            </div>
                          )}
                          {item.start && item.end && (
                            <div>🗓️ {formatDate(item.start.local)} - {formatDate(item.end.local)}</div>
                          )}
                          {item.ticket_availability && (
                            <div>
                              <span style={{ fontWeight: 600, color: item.ticket_availability.is_sold_out ? "#b91c1c" : "#16a34a" }}>
                                {item.ticket_availability.is_sold_out ? "Sold Out" : "Tickets Available"}
                              </span>
                              {!item.ticket_availability.is_sold_out && item.ticket_availability.minimum_ticket_price && (
                                <span style={{ color: "#6b7280", marginLeft: 8 }}>
                                  from {item.ticket_availability.minimum_ticket_price.display}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8 }}>
                          <span style={{ color: "#2563eb", fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {(typeof item.source === "string" ? item.source : item.source?.name || item.organizer?.name || "Unknown")}
                          </span>
                          <span style={{ color: "#6b7280" }}>{formatDate(item.date || item.start?.local)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => handleLoadMoreEvents(region)}
                      aria-label={`Load more events for ${region}`}
                      style={{ marginTop: 8, color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                    >
                      Load more...
                    </button>
                  )}
                </section>
              );
            })
          )
        }
      </div>
    </aside>
  );
}