import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  CLIMATE_KEYWORDS,
  normalizeText,
  formatDate,
  getRegion,
  deduplicateItems,
  sortByDate
} from "../utils/newsHelpers";

const ALLOWED_REGIONS = [
  "Africa", "Europe", "Asia", "North America", "South America", "Antarctica", "Australia", "Kenya"
];
const INITIAL_VISIBLE = 5;

export default function NewsEvents() {
  const [newsByRegion, setNewsByRegion] = useState({});
  const [eventsByRegion, setEventsByRegion] = useState({});
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorNews, setErrorNews] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);
  const [itemsToShowNews, setItemsToShowNews] = useState({});
  const [itemsToShowEvents, setItemsToShowEvents] = useState({});
  const [lastUpdatedNews, setLastUpdatedNews] = useState(null);
  const [lastUpdatedEvents, setLastUpdatedEvents] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const filterClimate = useCallback((items) => {
    return items.filter(item => {
      if (!item.title) return false;
      const text = normalizeText(`${item.title} ${item.description || ""} ${item.content || ""}`);
      return CLIMATE_KEYWORDS.some(k => new RegExp(`\\b${normalizeText(k)}\\b`, "i").test(text));
    });
  }, []);

  const groupByRegion = useCallback((items) => {
    const grouped = {};
    items.forEach(item => {
      let region = getRegion(item);
      const combinedText = [item.country, item.source, item.title, item.url].filter(Boolean).join(" ").toLowerCase();
      if (combinedText.includes("kenya")) region = "Kenya";
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(item);
    });
    Object.keys(grouped).forEach(r => grouped[r] = sortByDate(grouped[r]));
    return grouped;
  }, []);

  const fetchData = useCallback(async (type) => {
    const setLoading = type === "news" ? setLoadingNews : setLoadingEvents;
    const setError = type === "news" ? setErrorNews : setErrorEvents;
    const setData = type === "news" ? setNewsByRegion : setEventsByRegion;
    const setItemsToShow = type === "news" ? setItemsToShowNews : setItemsToShowEvents;
    const setLastUpdated = type === "news" ? setLastUpdatedNews : setLastUpdatedEvents;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/news?type=${type}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch ${type}: ${res.status} ${res.statusText}`);
      const responseData = await res.json();
      const items = responseData.items || [];
      if (!Array.isArray(items)) throw new Error(`Invalid ${type} response: items is not an array`);

      let filteredItems = type === "news" ? filterClimate(items) : items;

      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        filteredItems = filteredItems.filter(item => {
          const text = `${item.title} ${item.description || ""} ${item.content || ""}`.toLowerCase();
          return text.includes(query);
        });
      }

      const uniqueItems = deduplicateItems(filteredItems);
      const grouped = groupByRegion(uniqueItems);
      const limited = {};
      Object.keys(grouped).forEach(region => {
        if (ALLOWED_REGIONS.includes(region)) {
          limited[region] = grouped[region].slice(0, 15);
        }
      });
      setData(limited);

      const initialCounts = {};
      Object.keys(limited).forEach(r => initialCounts[r] = INITIAL_VISIBLE);
      setItemsToShow(initialCounts);

      setLastUpdated(new Date());

      if (debouncedQuery && type === "news") {
        const allTitles = uniqueItems.map(i => i.title).filter(Boolean);
        const filtered = allTitles.filter(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()));
        setSuggestions(filtered.slice(0, 5));
        setActiveSuggestion(-1);
      } else {
        setSuggestions([]);
      }

    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
      setData({});
      setItemsToShow({});
    } finally {
      setLoading(false);
    }
  }, [filterClimate, groupByRegion, debouncedQuery]);

  useEffect(() => {
    fetchData("news");
    fetchData("events");
  }, [fetchData]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleLoadMore = (region, type) => {
    const setItemsToShow = type === "news" ? setItemsToShowNews : setItemsToShowEvents;
    setItemsToShow(prev => ({ ...prev, [region]: (prev[region] || INITIAL_VISIBLE) + 5 }));
  };

  const handleSearchInput = (e) => setSearchQuery(e.target.value);
  const handleSearchClick = () => {
    fetchData("news");
    fetchData("events");
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        const selected = suggestions[activeSuggestion];
        setSearchQuery(selected);
        setDebouncedQuery(selected);
        setSuggestions([]);
        setActiveSuggestion(-1);
      } else {
        handleSearchClick();
      }
    }
  };

  const highlightMatch = (text) => {
    if (!debouncedQuery) return text;
    const regex = new RegExp(`(${debouncedQuery})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark> : part
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col py-16 mb-32 w-full lg:w-11/12 mx-auto">
      <div className="flex flex-col w-full max-w-5xl mb-4 relative">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            placeholder="Search news/events"
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleSearchClick}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
          >
            Search
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-50 bg-white dark:bg-gray-800 border rounded w-full max-w-md mt-1 max-h-60 overflow-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className={`px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${i === activeSuggestion ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                onMouseEnter={() => setActiveSuggestion(i)}
                onMouseLeave={() => setActiveSuggestion(-1)}
                onClick={() => {
                  setSearchQuery(s);
                  setDebouncedQuery(s);
                  setSuggestions([]);
                  setActiveSuggestion(-1);
                }}
                ref={el => {
                  if (i === activeSuggestion && el) el.scrollIntoView({ block: "nearest" });
                }}
              >
                {highlightMatch(s)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <section style={{ marginBottom: 32, width: "100%" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Climate News</h3>
          <button onClick={() => fetchData("news")} disabled={loadingNews}>
            <RefreshCw className={`w-4 h-4 ${loadingNews ? "animate-spin" : ""}`} />
          </button>
        </div>
        {lastUpdatedNews && <p className="text-xs text-gray-500 mb-2">Last updated: {lastUpdatedNews.toLocaleTimeString()}</p>}
        {loadingNews ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={50} />)
          : errorNews ? <p className="text-red-500">{errorNews}</p>
          : Object.entries(newsByRegion).length === 0 ? <p className="text-gray-500">No news found</p>
          : Object.entries(newsByRegion).map(([region, items]) => {
              const visibleCount = itemsToShowNews[region] || INITIAL_VISIBLE;
              const visibleItems = items.slice(0, visibleCount);
              return (
                <div key={region} className="mb-4">
                  <h4 className="font-semibold">{region}</h4>
                  <div className="flex flex-col gap-2">
                    {visibleItems.map((item, i) => (
                      <a key={item.url || i} href={item.url} target="_blank" rel="noopener noreferrer"
                        className="block p-3 rounded border hover:bg-gray-100 dark:hover:bg-gray-800">
                        <h5 className="font-medium">{highlightMatch(item.title)}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{highlightMatch(item.description?.substring(0, 120) || "")}</p>
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>{typeof item.source === "string" ? item.source : item.source?.name || "Unknown"}</span>
                          <span>{formatDate(item.publishedAt || item.date)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                  {visibleCount < items.length &&
                    <button onClick={() => handleLoadMore(region, "news")} className="text-blue-600 text-xs mt-1 underline">Load more...</button>}
                </div>
              );
            })}
      </section>

      <section style={{ width: "100%" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Climate Events</h3>
          <button onClick={() => fetchData("events")} disabled={loadingEvents}>
            <RefreshCw className={`w-4 h-4 ${loadingEvents ? "animate-spin" : ""}`} />
          </button>
        </div>
        {lastUpdatedEvents && <p className="text-xs text-gray-500 mb-2">Last updated: {lastUpdatedEvents.toLocaleTimeString()}</p>}
        {loadingEvents ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={50} />)
          : errorEvents ? <p className="text-red-500">{errorEvents}</p>
          : Object.entries(eventsByRegion).length === 0 ? <p className="text-gray-500">No events found</p>
          : Object.entries(eventsByRegion).map(([region, items]) => {
              const visibleCount = itemsToShowEvents[region] || INITIAL_VISIBLE;
              const visibleItems = items.slice(0, visibleCount);
              return (
                <div key={region} className="mb-4">
                  <h4 className="font-semibold">{region}</h4>
                  <div className="flex flex-col gap-2">
                    {visibleItems.map((item, i) => (
                      <a key={item.url || i} href={item.url} target="_blank" rel="noopener noreferrer"
                        className="block p-3 rounded border hover:bg-gray-100 dark:hover:bg-gray-800">
                        <h5 className="font-medium">{highlightMatch(item.title)}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{highlightMatch(item.description?.substring(0, 120) || "")}</p>
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>{item.organizer || typeof item.source === "string" ? item.source : item.source?.name || "Unknown"}</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                  {visibleCount < items.length &&
                    <button onClick={() => handleLoadMore(region, "events")} className="text-blue-600 text-xs mt-1 underline">Load more...</button>}
                </div>
              );
            })}
      </section>
    </div>
  );
}
