// src/pages/DashboardBasic.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import WeatherCards from "../components/WeatherCards";

export default function DashboardBasic() {
  const [geoJson, setGeoJson] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    axios.get("/api/geojson").then(res => setGeoJson(res.data));
    axios.get("/api/chartdata").then(res => setChartData(res.data));
    axios.get("/api/datasets").then(res => setDatasets(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Climate Dashboard - Basic</h1>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-1/3 w-full space-y-4">
          <WeatherCards />
        </div>

        <div className="md:w-2/3 w-full h-[400px] bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🗺️ Live Map</h2>
          <MapContainer center={[0.0236, 37.9062]} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {geoJson && <GeoJSON data={geoJson} />}
          </MapContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-2">📈 Climate Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0EA5E9" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">🗃️ Uploaded Datasets</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Uploader</th>
              <th className="border px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(datasets) &&
              datasets.map(dataset => (
                <tr key={dataset._id}>
                  <td className="border px-4 py-2">{dataset.name}</td>
                  <td className="border px-4 py-2">{dataset.uploader}</td>
                  <td className="border px-4 py-2">{new Date(dataset.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
