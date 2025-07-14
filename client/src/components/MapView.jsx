// src/components/MapView.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { fetchZones } from "../services/api";
import { getWeatherByCoords } from "../services/weather";

export default function MapView() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const loadZonesWithWeather = async () => {
      try {
        const res = await fetchZones();

        const zonesWithWeather = await Promise.all(
          res.data.map(async (zone) => {
            try {
              const weather = await getWeatherByCoords(
                zone.location.lat,
                zone.location.lng
              );
              return { ...zone, weather };
            } catch (e) {
              return { ...zone, weather: null };
            }
          })
        );

        setZones(zonesWithWeather);
      } catch (err) {
        console.error("Error loading zones:", err);
      }
    };

    loadZonesWithWeather();
  }, []);

  return (
    <MapContainer
      center={[-1.2864, 36.8172]}
      zoom={6}
      className="h-[500px] w-full rounded"
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {zones.map((zone, index) => (
        <Marker
          key={index}
          position={[zone.location.lat, zone.location.lng]}
        >
          <Popup>
            <strong>{zone.name}</strong>
            <br />
            Risk Level: {zone.riskLevel}
            <br />
            {zone.weather ? (
              <>
                🌡️ Temp: {zone.weather.temperature_2m}°C
                <br />
                ☔ Rain: {zone.weather.precipitation} mm
                <br />
                💨 Wind: {zone.weather.wind_speed_10m} km/h
              </>
            ) : (
              <em>Weather unavailable</em>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
