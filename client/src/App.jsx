// client/src/App.jsx
import { useEffect, useState } from "react";
import { fetchZones, createZone } from "./services/api";

function App() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const res = await fetchZones();
        setZones(res.data);
      } catch (err) {
        console.error("Error fetching zones:", err);
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, []);

  return (
    <div className="p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4">🌍 Risk Zones in Kenya</h1>
      {loading ? (
        <p>Loading zones...</p>
      ) : zones.length === 0 ? (
        <p>No risk zones found.</p>
      ) : (
        <ul className="list-disc ml-6 space-y-1">
          {zones.map((zone, index) => (
            <li key={index}>
              <strong>{zone.name}</strong> — Risk Level: {zone.riskLevel}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
