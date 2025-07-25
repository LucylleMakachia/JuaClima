import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import WeatherCards from "../components/WeatherCards";
import MapView from "../components/MapView";
import NewsSidebar from "../components/NewsSidebar";

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
        {/* Main content (75–85%) */}
        <div className="flex-grow max-w-full lg:max-w-[85%]">
          <HeroSection />
          <WeatherCards />
          <MapView />
        </div>

        {/* Sidebar on right */}
        <div className="hidden lg:block w-[15%]">
          <NewsSidebar />
        </div>
      </main>
    </div>
  );
}
