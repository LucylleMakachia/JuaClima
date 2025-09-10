import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

// Green marker icon
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -35],
  shadowSize: [41, 41],
});

export default function InteractiveMap({ datasets, setFiltered }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchRef = useRef(null);

  const { isSignedIn } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Track if user has selected area; controls global view display
  const [hasSelectedArea, setHasSelectedArea] = useState(false);

  const globalViewBounds = [[-60, -180], [85, 180]];
  const defaultCenter = [20, 0];
  const defaultZoom = 2;

  // Fetch suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      
      try {
        const res = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          { 
            params: { 
              q: searchQuery, 
              format: "json", 
              limit: 5,
              addressdetails: 1 
            } 
          }
        );
        setSuggestions(res.data || []);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Memoized map click handler
  const handleMapClick = useCallback((e) => {
    const { lat, lng } = e.latlng;
    placePin({ lat, lng }, null);
    setShowSuggestions(false);
  }, []);

  // Initialize Leaflet map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: true });

    // Start with global view bounds on first load
    map.fitBounds(globalViewBounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Global view button setup
    const globalBtn = L.control({ position: "topleft" });
    globalBtn.onAdd = function () {
      const btn = L.DomUtil.create("button", "global-view-btn");
      btn.innerHTML = "🌍";
      btn.style.background = "white";
      btn.style.border = "1px solid #ccc";
      btn.style.padding = "8px";
      btn.style.cursor = "pointer";
      btn.style.marginTop = "5px";
      btn.style.borderRadius = "4px";
      btn.style.fontSize = "16px";
      btn.title = "Global View";
      btn.onclick = (e) => {
        e.stopPropagation();
        resetToGlobalView();
      };
      return btn;
    };
    globalBtn.addTo(map);

    map.on("click", handleMapClick);

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
        // Remove any custom controls
        mapRef.current.eachLayer(layer => {
          if (layer instanceof L.Control) {
            mapRef.current.removeControl(layer);
          }
        });
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [setFiltered, handleMapClick]);

  // React to changes in hasSelectedArea to fit bounds if needed
  useEffect(() => {
    if (!mapRef.current) return;
    if (!hasSelectedArea) {
      mapRef.current.fitBounds(globalViewBounds);
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [hasSelectedArea, datasets]);

  const resetToGlobalView = () => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(globalViewBounds);
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSearchedPlace(null);
    setPlaceName("");
    setShowSuggestions(false);
    setFiltered(datasets);
    setHasSelectedArea(false);
  };

  const getZoomLevel = (placeData) => {
    if (!placeData) return 13;
    const address = placeData.address;
    if (address.hamlet || address.village || address.locality) return 14;
    if (address.town || address.city_district) return 13;
    if (address.city) return 12;
    if (address.county || address.state_district) return 10;
    if (address.state) return 8;
    if (address.country) return 6;
    return 13;
  };

  const placePin = async ({ lat, lng }, name, placeData = null) => {
    if (!mapRef.current) return;

    setSearchedPlace({ lat, lng });

    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    const popupText = name || (await getPlaceName(lat, lng)) || "Selected Location";
    setPlaceName(popupText);

    const marker = L.marker([lat, lng], { icon: greenIcon })
      .addTo(mapRef.current)
      .bindPopup(
        `<div class="text-sm min-w-[200px]">
          <h3 class="font-bold text-green-700 mb-1">${popupText}</h3>
          <p>Latitude: <span class="font-medium">${lat.toFixed(4)}</span></p>
          <p>Longitude: <span class="font-medium">${lng.toFixed(4)}</span></p>
        </div>`
      )
      .openPopup();

    markerRef.current = marker;

    const zoomLevel = getZoomLevel(placeData);
    mapRef.current.setView([lat, lng], zoomLevel);

    fetchLocationDatasets(lat, lng);

    setHasSelectedArea(true);
  };

  const getPlaceName = async (lat, lng) => {
    try {
      const res = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        { params: { lat, lon: lng, format: "json" } }
      );
      return res.data.display_name;
    } catch {
      return null;
    }
  };

  const handleSearch = async (place = null) => {
    if (!searchQuery && !place) return;

    const query = place ? place.display_name : searchQuery;

    try {
      const res = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        { params: { q: query, format: "json", limit: 1 } }
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon, display_name, ...placeData } = res.data[0];
        placePin({ lat: parseFloat(lat), lng: parseFloat(lon) }, display_name, placeData);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const fetchLocationDatasets = (lat, lng) => {
    try {
      const filteredDatasets = datasets.filter((d) => {
        const coords = d.geojson?.geometry?.coordinates;
        if (!coords || coords.length < 2) return false;
        
        // GeoJSON uses [longitude, latitude] order
        const [dlng, dlat] = coords;
        const distance = calculateDistance(lat, lng, dlat, dlng);
        return distance <= 500;
      });
      setFiltered(filteredDatasets);
    } catch (err) {
      console.error("Failed to filter datasets:", err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSuggestionClick = (place) => {
    setSearchQuery(place.display_name);
    handleSearch(place);
    setShowSuggestions(false);
  };

  const clearSearch = (e) => {
    e?.stopPropagation();
    setSearchQuery("");
    setSearchedPlace(null);
    setPlaceName("");
    setSuggestions([]);
    setShowSuggestions(false);
    resetToGlobalView();
  };

  return (
    <div className="w-full relative" style={{ marginTop: "0", zIndex: 1 }}>
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] rounded-xl shadow-lg overflow-hidden relative"
        style={{ position: "relative", zIndex: 1 }}
      />
      <div
        ref={searchRef}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex flex-col w-[550px] max-w-[90%] pointer-events-auto"
      >
        <div className="flex w-full">
          <button
            onClick={() => handleSearch()}
            className="bg-green-500 text-white px-4 py-2 rounded-l-md hover:bg-green-600 flex items-center justify-center pointer-events-auto"
            style={{
              backgroundColor: "#22c55e",
              borderTop: "1px solid #d1d5db",
              borderBottom: "1px solid #d1d5db",
              borderLeft: "1px solid #d1d5db",
            }}
            title="Search"
          >
            🔍
          </button>
          <input
            type="text"
            placeholder="Search location"
            className="flex-1 px-3 py-2 border-t border-b border-gray-300 outline-none pointer-events-auto bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                handleSearch();
                setShowSuggestions(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTop: "1px solid #d1d5db",
              borderBottom: "1px solid #d1d5db",
              borderRight: "none",
              borderLeft: "none",
            }}
          />
          {searchedPlace && (
            <button
              onClick={clearSearch}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r-md pointer-events-auto"
              style={{
                borderTop: "1px solid #d1d5db",
                borderBottom: "1px solid #d1d5db",
                borderRight: "1px solid #d1d5db",
              }}
              title="Clear Search"
            >
              ×
            </button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-b-md shadow-lg mt-0 max-h-60 overflow-y-auto">
            {suggestions.map((place, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSuggestionClick(place)}
              >
                {place.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}