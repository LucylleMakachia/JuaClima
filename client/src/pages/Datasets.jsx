import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAllDatasets, getLocationWeather } from "../services/datasetService";
import DatasetCard from "../components/DatasetCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import * as turf from "@turf/turf";

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationWeather, setLocationWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Fetch initial datasets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllDatasets();
        if (result.datasets && Array.isArray(result.datasets)) {
          setDatasets(result.datasets);
          setFiltered(result.datasets);
        } else if (Array.isArray(result)) {
          setDatasets(result);
          setFiltered(result);
        } else {
          console.error("Unexpected data format from API:", result);
          setDatasets([]);
          setFiltered([]);
        }
      } catch (err) {
        console.error("Failed to fetch datasets:", err);
        setDatasets([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch weather data for selected location
  useEffect(() => {
    if (!selectedLocation) return;

    const fetchLocationWeather = async () => {
      setLoadingWeather(true);
      try {
        const weather = await getLocationWeather(selectedLocation.lat, selectedLocation.lng);
        setLocationWeather(weather);
        
        // Filter datasets based on proximity to selected location (within 100km)
        const nearbyDatasets = datasets.filter((dataset) => {
          if (!dataset.coordinates) return false;
          
          const datasetPoint = turf.point(dataset.coordinates);
          const selectedPoint = turf.point([selectedLocation.lng, selectedLocation.lat]);
          const distance = turf.distance(datasetPoint, selectedPoint, { units: 'kilometers' });
          
          return distance <= 100; // Show datasets within 100km
        });
        
        // Add the new location weather data to filtered results
        const locationDataset = {
          _id: `location_${selectedLocation.lat}_${selectedLocation.lng}`,
          name: `Selected Location Weather`,
          description: `Weather data for selected location (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`,
          coordinates: [selectedLocation.lng, selectedLocation.lat],
          weather: weather,
          tags: ['selected', 'real-time', 'custom-location'],
          data_source: 'OpenWeatherMap API',
          last_updated: new Date().toISOString(),
          isCustomLocation: true
        };
        
        setFiltered([locationDataset, ...nearbyDatasets]);
      } catch (error) {
        console.error("Failed to fetch location weather:", error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchLocationWeather();
  }, [selectedLocation, datasets]);

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    // Set selected location
    setSelectedLocation({ lat, lng });
    
    // Remove existing marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }
    
    // Add new marker
    const customIcon = L.divIcon({
      html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      className: 'custom-marker'
    });
    
    markerRef.current = L.marker([lat, lng], { icon: customIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong>Selected Location</strong><br>
          <small>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}</small><br>
          <div style="margin-top: 8px; color: #666;">Loading weather data...</div>
        </div>
      `)
      .openPopup();
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setLocationWeather(null);
    setFiltered(datasets);
    
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Global Climate Datasets</h1>
            <p className="text-blue-100 text-lg">
              Click anywhere on the map to get real-time weather data for that location
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Section */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Interactive World Map</h2>
                      <p className="text-sm text-gray-600">Click anywhere to get weather data</p>
                    </div>
                    {selectedLocation && (
                      <button
                        onClick={clearSelection}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Clear Pin
                      </button>
                    )}
                  </div>
                  
                  {selectedLocation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">📍 Selected:</span> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </p>
                      {loadingWeather && (
                        <p className="text-xs text-blue-600 mt-1">Loading weather data...</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div
                  className="h-[500px] cursor-crosshair"
                  ref={(el) => {
                    if (el && !mapRef.current) {
                      // Initialize with world view
                      const map = L.map(el).setView([20, 0], 2);

                      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution: "&copy; OpenStreetMap contributors",
                      }).addTo(map);

                      mapRef.current = map;

                      // Add click handler
                      map.on("click", handleMapClick);
                    }
                  }}
                />
              </div>
            </div>

            {/* Datasets Section */}
            <div className="w-full lg:w-2/3">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedLocation ? 'Location Weather Data' : 'Available Datasets'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {filtered.length} dataset{filtered.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {selectedLocation ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">🎯 Custom Location:</span> Showing weather data for your selected point and nearby datasets (within 100km)
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">🌍 Global Coverage:</span> Click anywhere on the map to get instant weather data for that location
                    </p>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading climate datasets...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No datasets found</h3>
                      <p className="text-gray-500 mb-4">
                        Click anywhere on the map to get weather data for that location.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {loadingWeather && selectedLocation && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <p className="text-gray-600">Fetching weather data for selected location...</p>
                          </div>
                        </div>
                      )}
                      
                      {filtered.map((d) => (
                        <DatasetCard key={d._id} dataset={d} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}