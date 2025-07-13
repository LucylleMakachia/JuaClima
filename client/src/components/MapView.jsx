import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// Custom FitBounds component
const FitBounds = ({ zones }) => {
  const map = useMap();

  useEffect(() => {
    if (zones && zones.length > 0) {
      // Filter zones that have valid location data
      const validZones = zones.filter(zone => 
        zone.location && 
        typeof zone.location.lat === 'number' && 
        typeof zone.location.lng === 'number'
      );
      
      if (validZones.length > 0) {
        const bounds = validZones.map(zone => [zone.location.lat, zone.location.lng]);
        map.fitBounds(bounds);
      }
    }
  }, [zones, map]);

  return null;
};

const MapView = ({ zones }) => {
  // Filter out zones without valid location data
  const validZones = zones.filter(zone => {
    const hasLocation = zone.location && 
                       typeof zone.location.lat === 'number' && 
                       typeof zone.location.lng === 'number';
    
    if (!hasLocation) {
      console.warn('Zone missing location data:', zone);
    }
    
    return hasLocation;
  });

  return (
    <MapContainer
      center={[-1.286389, 36.817223]} // fallback if no zones
      zoom={6}
      className="h-[400px] w-full rounded mb-6"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds zones={validZones} />

      {validZones.map((zone, i) => (
        <Marker key={zone._id || i} position={[zone.location.lat, zone.location.lng]}>
          <Popup>
            <strong>{zone.name}</strong><br />
            Risk Level: {zone.riskLevel}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;