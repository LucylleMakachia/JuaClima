import React, { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import WeatherCards from "../components/WeatherCards";
import MapView from "../components/MapView";

export default function Home() {
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Load saved coords from localStorage on mount
  useEffect(() => {
    const savedCoords = localStorage.getItem("selectedCoords");
    if (savedCoords) {
      setSelectedCoords(JSON.parse(savedCoords));
    }
  }, []);

  // Save coords to localStorage whenever it changes
  useEffect(() => {
    if (selectedCoords) {
      localStorage.setItem("selectedCoords", JSON.stringify(selectedCoords));
    }
  }, [selectedCoords]);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center py-16 mb-32">
      <div className="flex flex-col w-full lg:w-4/5 gap-12">
        {/* Hero Section */}
        <HeroSection />

        {/* WeatherCards + MapView */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">
          {/* WeatherCards container */}
          <div className="w-full lg:w-1/4 px-6 py-10 min-h-[560px] rounded-lg shadow-lg">
            <WeatherCards coords={selectedCoords} />
          </div>

          {/* Map container */}
          <div className="w-full lg:w-3/4 rounded-lg shadow-lg min-h-[650px]">
            <MapView
              selectedCoords={selectedCoords}
              onMapClick={setSelectedCoords}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
