import { useEffect, useState } from "react";
import { fetchZones } from "./services/api";
import RiskZoneForm from "./components/RiskZoneForm";
import MapView from "./components/MapView";

function App() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetchZones()
      .then((res) => {
        console.log("Raw API response:", res.data); // Debug log
        
        // Normalize the data to always use 'location' property
        const normalizedZones = res.data.map(zone => {
          const location = zone.location || zone.coordinates;
          
          if (!location) {
            console.warn("Zone missing location/coordinates:", zone);
            return null;
          }
          
          return {
            ...zone,
            location: location
          };
        }).filter(Boolean); // Remove null entries
        
        console.log("Normalized zones:", normalizedZones); // Debug log
        setZones(normalizedZones);
      })
      .catch((err) => console.error("Failed to fetch zones:", err));
  }, []);

  const handleAdd = (newZone) => {
    setZones((prev) => [...prev, newZone]);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">JuaClima Risk Zones</h1>

      <RiskZoneForm onNewZone={handleAdd} />

      <MapView zones={zones} />
    </div>
  );
}

export default App;