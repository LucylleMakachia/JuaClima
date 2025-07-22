import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";

// Component to auto-zoom to GeoJSON bounds
function FitBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (data) {
      const geojsonLayer = L.geoJSON(data);
      const bounds = geojsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    }
  }, [data, map]);

  return null;
}

export default function MapPreview({ geoJsonData }) {
  if (!geoJsonData) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">🗺️ Map Preview</h3>
        <p className="text-gray-500 italic">No GeoJSON data to preview.</p>
      </div>
    );
  }

  // Optional: Add style and popup
  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    if (props) {
      const popupContent = Object.entries(props)
        .map(([key, val]) => `<strong>${key}</strong>: ${val}`)
        .join("<br/>");
      layer.bindPopup(popupContent);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">🗺️ Map Preview</h3>
      <MapContainer center={[0.0236, 37.9062]} zoom={5} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON
          data={geoJsonData}
          style={() => ({
            color: "#3388ff",
            weight: 2,
            fillOpacity: 0.3,
          })}
          onEachFeature={onEachFeature}
        />
        <FitBounds data={geoJsonData} />
      </MapContainer>
    </div>
  );
}
