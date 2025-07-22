import { useEffect, useState } from "react";
import { fetchZones } from "../services/api";
import RiskZoneForm from "../components/RiskZoneForm";
import MapView from "../components/MapView";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import WeatherCards from "../components/WeatherCards";

export default function Home() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetchZones()
      .then((res) => {
        const normalizedZones = Array.isArray(res.data)
          ? res.data
              .map((zone) => {
                const location = zone.location || zone.coordinates;
                if (!location) {
                  return null;
                }
                return {
                  ...zone,
                  location,
                };
              })
              .filter(Boolean)
          : [];
        setZones(normalizedZones);
      })
      .catch((err) => console.error("Failed to fetch zones:", err));
  }, []);

  const handleAdd = (newZone) => {
    setZones((prev) => [...prev, newZone]);
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <Navbar />
      <HeroSection />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section id="features" className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">
            JuaClima Risk Zones
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Risk Zone Form */}
            <div className="md:col-span-1">
              <RiskZoneForm onNewZone={handleAdd} />
            </div>

            {/* Weather Cards and Map side by side */}
            <div className="md:col-span-2" id="map">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left side: Weather Cards + heading */}
                <div className="md:w-1/3">
                  <h3 className="text-xl font-semibold mb-4 text-left">
                    Live Weather Snapshot
                  </h3>
                  <WeatherCards />
                </div>

                {/* Right side: Map + heading */}
                <div className="md:w-2/3">
                  <h3 className="text-xl font-semibold mb-4 text-left">
                    Interactive Climate Map
                  </h3>
                  <div className="h-[600px]">
                    <MapView zones={zones} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
