import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getWeatherByCoords } from "../services/weather";
import axios from "axios";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function LocationPicker({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView({ selectedCoords, onMapClick }) {
  const [weather, setWeather] = useState(null);
  const [placeName, setPlaceName] = useState("Selected Location");
  const [error, setError] = useState(null);

  const markerRef = useRef(null);

  useEffect(() => {
    if (!selectedCoords) return;

    // Fetch weather data
    const fetchWeather = async () => {
      try {
        const data = await getWeatherByCoords(
          selectedCoords.lat,
          selectedCoords.lng
        );
        setWeather(data);
        setError(null);

        // Open popup after short delay (helps React-Leaflet show popup)
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }, 100);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Failed to fetch weather");
      }
    };

    // Fetch place name via reverse geocode using Nominatim
    const fetchPlaceName = async () => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse`,
          {
            params: {
              lat: selectedCoords.lat,
              lon: selectedCoords.lng,
              format: "json",
            },
          }
        );
        // Use display_name or fallback
        setPlaceName(res.data.display_name || "Selected Location");
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
        setPlaceName("Selected Location");
      }
    };

    fetchWeather();
    fetchPlaceName();
  }, [selectedCoords]);

  const safeValue = (val, unit = "", zeroIsValid = false) =>
    val === undefined || val === null || (!zeroIsValid && val === 0)
      ? zeroIsValid
        ? `0${unit}`
        : "N/A"
      : `${val}${unit}`;

  return (
    <MapContainer
      center={selectedCoords || [0.0236, 37.9062]} // Kenya default
      zoom={selectedCoords ? 8 : 6}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationPicker onMapClick={onMapClick} />

      {selectedCoords && weather && (
        <Marker position={[selectedCoords.lat, selectedCoords.lng]} ref={markerRef}>
          <Popup>
            <div className="min-w-[220px]">
              <h3 className="font-bold mb-2">{placeName}</h3>
              <p className="text-xs text-gray-600 mb-1">
                Last updated: {new Date().toLocaleString()}
              </p>
              <div>🌡️ Temperature: {safeValue(weather.temperature_2m, "°C")}</div>
              <div>☔ Rainfall: {safeValue(weather.precipitation, " mm", true)}</div>
              <div>💨 Wind Speed: {safeValue(weather.wind_speed_10m, " km/h")}</div>
              <div>💧 Humidity: {safeValue(weather.relative_humidity_2m, "%")}</div>
              <div>🌤️ UV Index: {safeValue(weather.uv_index)}</div>
              <div>☁️ Cloud Cover: {safeValue(weather.cloud_cover, "%")}</div>
              <div className="mt-2 text-xs text-gray-500">Source: Open-Meteo.com</div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
