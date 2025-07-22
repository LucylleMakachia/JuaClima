import { useEffect, useState } from "react";
import axios from "axios";

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const fetchSuggestions = async (q) => {
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q,
          format: "json",
          limit: 5,
        },
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Nominatim search error:", err);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) fetchSuggestions(val);
    else setSuggestions([]);
  };

  const handleSelect = (place) => {
    const coords = [parseFloat(place.lat), parseFloat(place.lon)];

    const entry = {
      name: place.display_name,
      center: coords,
      timestamp: Date.now(),
    };

    const updated = [entry, ...recent.filter(r => r.name !== entry.name)].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setRecent(updated);

    onSelect(entry);
    setQuery("");
    setSuggestions([]);
  };

  const handleRecentClick = (r) => {
    onSelect(r);
  };

  const clearRecent = () => {
    localStorage.removeItem("recentSearches");
    setRecent([]);
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search place..."
        className="border rounded p-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="bg-white border mt-1 rounded shadow z-10 relative">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <div className="mt-2 text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold">Recent:</span>
            <button onClick={clearRecent} className="text-xs text-red-500 hover:underline">
              Clear
            </button>
          </div>
          <ul className="bg-gray-100 rounded p-2 space-y-1">
            {recent.map((r, i) => (
              <li
                key={i}
                onClick={() => handleRecentClick(r)}
                className="cursor-pointer hover:underline"
              >
                {r.name.split(",")[0]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
