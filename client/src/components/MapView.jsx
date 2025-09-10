import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { OpenStreetMapProvider } from "leaflet-geosearch";

// Green marker icon
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -35],
  shadowSize: [41, 41],
});

// Search bar component
function SearchBar({ onSelect, mapRef, markerRef }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const provider = useRef(new OpenStreetMapProvider());

  const handleSearch = async (text) => {
    if (!text) return setSuggestions([]);
    try {
      const results = await provider.current.search({ query: text });
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s) => {
    const { x: lng, y: lat, label, bounds } = s;
    onSelect({ lat, lng }, label);
    setQuery(label);
    setSuggestions([]);

    if (bounds?.[0] && bounds?.[1]) {
      const leafletBounds = L.latLngBounds(
        L.latLng(bounds[0].y, bounds[0].x),
        L.latLng(bounds[1].y, bounds[1].x)
      );
      mapRef.current.flyToBounds(leafletBounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      mapRef.current.setView([lat, lng], 16);
    }

    setTimeout(() => markerRef.current?.openPopup(), 300);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-80 bg-white rounded-md shadow-md p-1">
      <div className="flex">
        <button
          onClick={() => handleSearch(query)}
          className="bg-green-500 text-white px-3 py-1 rounded-l-md hover:bg-green-600"
        >
          🔍
        </button>
        <input
          type="text"
          placeholder="Search location"
          value={query}
          onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) selectSuggestion(suggestions[0]);
          }}
          className="flex-1 px-2 py-1 rounded-r-md border-none outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="max-h-52 overflow-y-auto border-t border-gray-200">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => selectSuggestion(s)}
              className="px-2 py-1 hover:bg-gray-100 truncate cursor-pointer"
              title={s.label}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Map click handler
function LocationPicker({ onClick }) {
  useMapEvents({
    click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// Main map component
export default function MapView({ selectedCoords, onMapClick }) {
  const [placeName, setPlaceName] = useState("Nairobi");
  const mapRef = useRef();
  const markerRef = useRef();

  const handleSelect = (coords, label) => {
    onMapClick(coords);
    setPlaceName(label);
  };

  useEffect(() => {
    if (!selectedCoords) return;

    const fetchPlaceName = async () => {
      try {
        const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: { lat: selectedCoords.lat, lon: selectedCoords.lng, format: "json" },
        });
        setPlaceName(res.data.display_name || "Selected Location");
      } catch {
        setPlaceName("Selected Location");
      }
    };
    fetchPlaceName();

    if (mapRef.current) {
      mapRef.current.flyTo([selectedCoords.lat, selectedCoords.lng], 16);
      setTimeout(() => markerRef.current?.openPopup(), 300);
    }
  }, [selectedCoords]);

  return (
    <div className="relative w-full h-[650px]">
      {/* Search bar visible on top of map */}
      <SearchBar onSelect={handleSelect} mapRef={mapRef} markerRef={markerRef} />

      <MapContainer
        center={selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : [-1.2921, 36.8219]}
        zoom={10}
        scrollWheelZoom
        className="w-full h-full rounded-xl z-0"
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationPicker onClick={onMapClick} />

        {selectedCoords && (
          <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={greenIcon} ref={markerRef}>
            <Popup autoPan={false} closeButton>
              <div className="text-sm min-w-[200px]">
                <h3 className="font-bold text-green-700 mb-1">{placeName}</h3>
                <p>Latitude: <span className="font-medium">{selectedCoords.lat.toFixed(4)}</span></p>
                <p>Longitude: <span className="font-medium">{selectedCoords.lng.toFixed(4)}</span></p>
                <p className="mt-1 text-gray-500 text-xs">Click elsewhere to select another location</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
