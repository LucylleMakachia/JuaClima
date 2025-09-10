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

  if (error) return <div className="text-red-500">{error}</div>;
  if (!weather) return <div>Loading weather...</div>;

  const safeValue = (val, unit = "", allowZero = false) =>
    val === undefined || val === null || (val === 0 && !allowZero)
      ? "N/A"
      : `${val}${unit}`;

  const cards = [
    { label: "🌡️ Temperature", value: safeValue(weather.temperature_2m, "°C"), bg: "bg-blue-600", glow: "shadow-blue-400/70", sparkleColor: "#60A5FA" },
    { label: "☔ Rainfall", value: safeValue(weather.precipitation, " mm", true), bg: "bg-green-600", glow: "shadow-green-400/70", sparkleColor: "#34D399" },
    { label: "💨 Wind Speed", value: safeValue(weather.wind_speed_10m, " km/h"), bg: "bg-yellow-600", glow: "shadow-yellow-400/70", sparkleColor: "#FACC15" },
    { label: "💧 Humidity", value: safeValue(weather.relative_humidity_2m, "%"), bg: "bg-cyan-700", glow: "shadow-cyan-400/70", sparkleColor: "#22D3EE" },
    { label: "🌤️ UV Index", value: safeValue(weather.uv_index), bg: "bg-rose-700", glow: "shadow-rose-400/70", sparkleColor: "#F472B6" },
    { label: "☁️ Cloud Cover", value: safeValue(weather.cloud_cover, "%"), bg: "bg-gray-700", glow: "shadow-gray-400/70", sparkleColor: "#9CA3AF" },
  ];

  const randomFloat = (min, max) => Math.random() * (max - min) + min;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 w-full lg:w-[260px]">
      {cards.map((card, index) => {
        const translateY = randomFloat(2, 6);
        const rotateDeg = randomFloat(0.5, 2);

        return (
          <div
            key={index}
            className={`
              ${card.bg} rounded-lg p-4 text-white shadow-md relative overflow-hidden
              transform transition duration-300 hover:-translate-y-2 hover:scale-105 ${card.glow} hover:shadow-[0_0_15px_8px]
            `}
            style={{
              animation: `bobTilt 3s ease-in-out infinite`,
              animationDelay: `${index * 0.2}s`,
              "--translateY": `${translateY}px`,
              "--rotateDeg": `${rotateDeg}deg`,
            }}
          >
            {/* Sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => {
                const size = randomFloat(2, 4);
                const top = randomFloat(10, 30);
                const left = randomFloat(10, 90);
                const duration = randomFloat(2, 5);
                const delay = randomFloat(0, 2);

                return (
                  <span
                    key={i}
                    className="absolute rounded-full opacity-80"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      top: `${top}%`,
                      left: `${left}%`,
                      backgroundColor: card.sparkleColor,
                      boxShadow: `0 0 6px ${card.sparkleColor}`,
                      animation: `sparkleMove ${duration}s linear infinite`,
                      animationDelay: `${delay}s`,
                    }}
                  />
                );
              })}
            </div>

            <h3 className="text-sm font-semibold relative z-10">{card.label}</h3>
            <p className="text-xl font-bold relative z-10">{card.value}</p>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes bobTilt {
          0%, 100% {
            transform: translateY(0) rotateZ(0);
          }
          50% {
            transform: translateY(var(--translateY)) rotateZ(var(--rotateDeg));
          }
        }

        @keyframes sparkleMove {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
