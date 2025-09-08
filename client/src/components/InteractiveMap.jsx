import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function InteractiveMap({ datasets, setFiltered }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Use your API key from environment variable
  const CS_MAP_KEY = import.meta.env.VITE_CS_MAP_KEY; // Add this to .env

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current).setView([20, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      // Initialize CS map / bundle if key exists
      if (CS_MAP_KEY) {
        // Replace with your library init code
        // e.g., CSMainWorld.init({ key: CS_MAP_KEY, container: mapContainerRef.current });
        console.log("CS Map initialized with key:", CS_MAP_KEY);
      } else {
        console.warn(
          "CS Map API key not found. Please set VITE_CS_MAP_KEY in your .env"
        );
      }

      map.on("click", handleMapClick);
      setMapError(null);
    } catch (err) {
      console.error("Leaflet map init failed:", err);
      setMapError("Failed to initialize map. Please refresh the page.");
    }
  }, []);

  // Cleanup map
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleMapClick = (e) => {
    if (!e?.latlng || !mapRef.current) return;
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lng });

    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    const customIcon = L.divIcon({
      html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>`,
      iconSize: [20, 20],
      className: "custom-marker",
    });

    markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(
      mapRef.current
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Interactive World Map
        </h2>
      </div>

      {selectedLocation && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            📍 Selected: {selectedLocation.lat.toFixed(4)},{" "}
            {selectedLocation.lng.toFixed(4)}
          </p>
          {loadingWeather && (
            <p className="text-xs text-blue-600 mt-1">
              Loading weather data...
            </p>
          )}
        </div>
      )}

      {mapError && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-700 underline text-xs"
          >
            Try refreshing
          </button>
        </div>
      )}

      <div ref={mapContainerRef} className="h-[500px] cursor-crosshair" />
    </div>
  );
}
