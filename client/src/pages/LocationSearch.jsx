import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { countries } from "../utils/countries";


function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selected, setSelected] = useState(null);
  const [region, setRegion] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, region]);

  const fetchSuggestions = async (q) => {
    try {
      const params = {
        q,
        format: "json",
        limit: 5,
      };
      if (region) params.countrycodes = region;
      const res = await axios.get("https://nominatim.openstreetmap.org/search", { params });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Nominatim search error:", err);
    }
  };

  const handleChange = (e) => setQuery(e.target.value);

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
    setSelected(entry);
    setQuery("");
    setSuggestions([]);
  };

  const handleRecentClick = (r) => {
    onSelect(r);
    setSelected(r);
  };

  const clearRecent = () => {
    localStorage.removeItem("recentSearches");
    setRecent([]);
  };

  return (
    <div className="mb-4 space-y-4">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search place..."
        className="border rounded p-2 w-full"
      />

      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="">🌍 All Regions</option>
        <option value="za">🇿🇦 South Africa</option>
        <option value="ke">🇰🇪 Kenya</option>
        <option value="ng">🇳🇬 Nigeria</option>
        <option value="gh">🇬🇭 Ghana</option>
        <option value="eg">🇪🇬 Egypt</option>
        <option value="tz">🇹🇿 Tanzania</option>
        {/* Add more if needed */}
      </select>

      {suggestions.length > 0 && (
        <ul className="bg-white border rounded shadow z-10 relative">
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
        <div className="text-sm">
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

      {selected?.center && (
        <div className="mt-4 border rounded overflow-hidden">
          <MapContainer center={selected.center} zoom={13} style={{ height: "200px", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={selected.center} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
