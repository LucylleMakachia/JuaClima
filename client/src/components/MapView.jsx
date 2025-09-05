import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { OpenStreetMapProvider } from "leaflet-geosearch";

// Online green marker URLs
const greenIconUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
const greenIconRetinaUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
const shadowUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Create Leaflet green icon
const greenIcon = new L.Icon({
  iconUrl: greenIconUrl,
  iconRetinaUrl: greenIconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Search control with top center positioning and suggestions
function SearchControl({ onMapClick, onPlaceNameUpdate, mapRef, markerRef }) {
  const map = useMap();
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const provider = useRef(new OpenStreetMapProvider());
  const containerRef = useRef();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  const handleSearch = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await provider.current.search({ query });
      setSuggestions(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const { x: lng, y: lat, label, bounds } = suggestion;

    onMapClick({ lat, lng });
    onPlaceNameUpdate(label);
    setSearchText(label);
    setSuggestions([]);

    if (bounds && bounds[0] && bounds[1]) {
      const leafletBounds = L.latLngBounds(
        L.latLng(bounds[0].y, bounds[0].x),
        L.latLng(bounds[1].y, bounds[1].x)
      );
      map.flyToBounds(leafletBounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView([lat, lng], 16);
    }

    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 500);
  };

  // Close suggestions dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()} // Prevent map click when clicking on search bar
      style={{
        position: "absolute",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "320px",
        background: "white",
        borderRadius: "4px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
        padding: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={() => handleSearch(searchText)}
          style={{
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "8px 12px",
            borderTopLeftRadius: "4px",
            borderBottomLeftRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Search"
          title="Search"
        >
          🔍
        </button>
        <input
          type="text"
          placeholder="Search for a location"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            handleSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchText.trim()) {
              e.preventDefault();
              handleSearch(searchText);
              if (suggestions.length === 1) {
                selectSuggestion(suggestions[0]);
              }
            }
          }}
          style={{
            border: "none",
            padding: "8px 12px",
            outline: "none",
            width: "100%",
            borderTopRightRadius: "4px",
            borderBottomRightRadius: "4px",
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "4px 0",
            maxHeight: "200px",
            overflowY: "auto",
            borderTop: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              onClick={() => selectSuggestion(suggestion)}
              style={{
                padding: "6px 10px",
                borderBottom: "1px solid #eee",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={suggestion.label}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Map click handler
function LocationPicker({ onMapClick, mapRef, markerRef }) {
  useMapEvents({
    click: async (e) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      onMapClick(coords);

      if (!mapRef.current) return;

      try {
        const res = await axios.get(
          "https://nominatim.openstreetmap.org/reverse",
          {
            params: {
              lat: coords.lat,
              lon: coords.lng,
              format: "json",
              zoom: 10,
              addressdetails: 1,
            },
          }
        );

        const flyToLocation = () => {
          setTimeout(() => {
            if (markerRef.current) {
              markerRef.current.openPopup();
            }
          }, 500);
        };

        if (res.data && res.data.boundingbox) {
          const [south, north, west, east] = res.data.boundingbox.map(Number);
          const bounds = L.latLngBounds(
            L.latLng(south, west),
            L.latLng(north, east)
          );
          mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          flyToLocation();
        } else {
          mapRef.current.flyTo([coords.lat, coords.lng], 13);
          flyToLocation();
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
        mapRef.current.flyTo([coords.lat, coords.lng], 13);
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }, 500);
      }
    },
  });
  return null;
}

// Main Map component
export default function MapView({ selectedCoords, onMapClick }) {
  const [placeName, setPlaceName] = useState("Nairobi");
  const mapRef = useRef();
  const markerRef = useRef();

  // Reverse geocode selectedCoords for popup name
  useEffect(() => {
    if (!selectedCoords) return;

    const fetchPlaceName = async () => {
      try {
        const res = await axios.get(
          "https://nominatim.openstreetmap.org/reverse",
          {
            params: {
              lat: selectedCoords.lat,
              lon: selectedCoords.lng,
              format: "json",
            },
          }
        );
        setPlaceName(res.data.display_name || "Selected Location");
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
        setPlaceName("Selected Location");
      }
    };

    fetchPlaceName();
  }, [selectedCoords]);

  // Keep popup in view if map moves or zooms
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const handleMove = () => {
      if (markerRef.current && markerRef.current.getPopup()) {
        markerRef.current.getPopup().update();
      }
    };

    mapRef.current.on("move", handleMove);
    mapRef.current.on("zoom", handleMove);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("move", handleMove);
        mapRef.current.off("zoom", handleMove);
      }
    };
  }, [mapRef, markerRef]);

  return (
    <div>
      <MapContainer
        center={
          selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : [-1.2921, 36.8219]
        } // Nairobi city center
        zoom={10}
        scrollWheelZoom={true}
        className="w-full rounded-xl z-0"
        style={{ height: "650px", maxWidth: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SearchControl
          onMapClick={onMapClick}
          onPlaceNameUpdate={setPlaceName}
          mapRef={mapRef}
          markerRef={markerRef}
        />

        <LocationPicker
          onMapClick={onMapClick}
          mapRef={mapRef}
          markerRef={markerRef}
        />

        {selectedCoords && (
          <Marker
            position={[selectedCoords.lat, selectedCoords.lng]}
            icon={greenIcon}
            ref={markerRef}
          >
            <Popup autoPan autoPanPadding={[50, 50]} keepInView>
              <div className="min-w-[180px]">
                <h3 className="font-bold mb-2">{placeName}</h3>
                <p className="text-sm text-gray-600">
                  Lat: {selectedCoords.lat.toFixed(4)}
                </p>
                <p className="text-sm text-gray-600">
                  Lng: {selectedCoords.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
