import React, { useEffect, useState } from "react";
import { getWeatherByCoords } from "../services/weather";

export default function WeatherCards({ coords }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coords) return;

    const fetchWeather = async (lat, lng) => {
      try {
        const data = await getWeatherByCoords(lat, lng);
        setWeather(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch weather");
        console.error(err);
      }
    };

    fetchWeather(coords.lat, coords.lng);
  }, [coords]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!weather) return <div className="p-4">Loading weather...</div>;

  // Allow zero for rainfall, treat zero as valid value
  const safeValue = (val, unit = "", allowZero = false) =>
    val === undefined || val === null || (val === 0 && !allowZero)
      ? "N/A"
      : `${val}${unit}`;

  const cards = [
    {
      label: "🌡️ Temperature",
      value: safeValue(weather.temperature_2m, "°C"),
      bg: "bg-blue-600",
    },
    {
      label: "☔ Rainfall",
      value: safeValue(weather.precipitation, " mm", true), // allow zero here
      bg: "bg-green-600",
    },
    {
      label: "💨 Wind Speed",
      value: safeValue(weather.wind_speed_10m, " km/h"),
      bg: "bg-yellow-600",
    },
    {
      label: "💧 Humidity",
      value: safeValue(weather.relative_humidity_2m, "%"),
      bg: "bg-cyan-700",
    },
    {
      label: "🌤️ UV Index",
      value: safeValue(weather.uv_index),
      bg: "bg-rose-700",
    },
    {
      label: "☁️ Cloud Cover",
      value: safeValue(weather.cloud_cover, "%"),
      bg: "bg-gray-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 p-4 text-white w-full lg:w-[320px]">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bg} rounded-lg p-4 shadow-md`}>
          <h3 className="text-sm font-semibold">{card.label}</h3>
          <p className="text-xl">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
