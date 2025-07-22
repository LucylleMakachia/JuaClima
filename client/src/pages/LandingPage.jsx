import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import WeatherCards from "../components/WeatherCards";
import MapView from "../components/MapView";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";

export default function LandingPage() {
  const weatherCardsRef = useRef(null);
  const [cardsHeight, setCardsHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [isMdUp, setIsMdUp] = useState(window.matchMedia("(min-width: 768px)").matches);

  const [selectedCoords, setSelectedCoords] = useState({
    lat: -1.2921,
    lng: 36.8219,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const updateHeight = () => {
      if (weatherCardsRef.current) {
        setCardsHeight(weatherCardsRef.current.offsetHeight);
      }
      setWindowHeight(window.innerHeight);
      setIsMdUp(mediaQuery.matches);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    mediaQuery.addEventListener("change", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      mediaQuery.removeEventListener("change", updateHeight);
    };
  }, []);

  const handleMapClick = (latlng) => {
    setSelectedCoords(latlng);
  };

  const NAV_FOOTER_BUFFER = 120; // Approximate navbar + footer height

  let mapHeight;
  if (isMdUp) {
    const availableHeight = windowHeight - NAV_FOOTER_BUFFER;
    // Map height is at least cardsHeight, available height, or 400px
    mapHeight = Math.max(cardsHeight, availableHeight, 400);
  } else {
    // On small screens: max half viewport height or 350px max to avoid overlap
    mapHeight = Math.min(windowHeight * 0.5, 350);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 pt-[72px] flex flex-col">
        <HeroSection />

        <section className="flex flex-col md:flex-row gap-6 mt-10 flex-grow min-h-0">
          {/* Weather Cards */}
          <div
            className="md:w-1/3 w-full"
            ref={weatherCardsRef}
            style={{ minWidth: 0 }} // Prevent flex overflow
          >
            <h2 className="text-2xl font-bold mb-4 text-left">
              Live Weather Snapshot
            </h2>
            <WeatherCards coords={selectedCoords} />
          </div>

          {/* Map View */}
          <div
            className="md:w-2/3 w-full"
            style={{
              height: mapHeight,
              minHeight: 400,
              maxHeight: windowHeight - 100,
              minWidth: 0,
            }}
          >
            <h2 className="text-2xl font-bold mb-4 text-left">
              Interactive Weather Map
            </h2>
            <MapView selectedCoords={selectedCoords} onMapClick={handleMapClick} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
