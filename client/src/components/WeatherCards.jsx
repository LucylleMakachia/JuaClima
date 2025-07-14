import React, { useEffect, useState } from "react";
import { getWeatherByCoords } from "../services/weather";

export default function WeatherCards() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async (lat, lng) => {
      try {
        const data = await getWeatherByCoords(lat, lng);
        setWeather(data);
      } catch (err) {
        setError("Failed to fetch weather");
        console.error(err);
      }
    };

    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      () => {
        // fallback to Nairobi
        fetchWeather(-1.2864, 36.8172);
      }
    );
  }, []);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!weather) return <div className="p-4">Loading weather...</div>;

  const cards = [
    { label: "🌡️ Temperature", value: `${weather.temperature_2m}°C`, bg: "bg-blue-600" },
    { label: "☔ Rainfall", value: `${weather.precipitation} mm`, bg: "bg-green-600" },
    { label: "💨 Wind Speed", value: `${weather.wind_speed_10m} km/h`, bg: "bg-yellow-600" },
    { label: "💧 Humidity", value: `${weather.relative_humidity_2m}%`, bg: "bg-cyan-700" },
    { label: "🌤️ UV Index", value: `${weather.uv_index}`, bg: "bg-rose-700" },
    { label: "☁️ Cloud Cover", value: `${weather.cloud_cover}%`, bg: "bg-gray-700" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 text-white">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bg} rounded-lg p-4 shadow-md`}>
          <h3 className="text-lg font-semibold">{card.label}</h3>
          <p className="text-2xl">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
