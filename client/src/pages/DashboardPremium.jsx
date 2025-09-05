import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import WeatherCards from "../components/WeatherCards";

export default function DashboardPremium() {
  const [geoJson, setGeoJson] = useState(null);
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    axios.get("/api/geojson").then((res) => setGeoJson(res.data));
    axios.get("/api/chartdata/line").then((res) => setLineChartData(res.data));
    axios.get("/api/chartdata/bar").then((res) => setBarChartData(res.data));
    axios.get("/api/datasets").then((res) => setDatasets(res.data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🌟 Premium Climate Dashboard</h1>

      {/* Weather Cards + Map Side-by-Side */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Weather Cards */}
        <div className="md:w-1/3 w-full space-y-4">
          <WeatherCards />
          <div className="bg-yellow-50 p-4 rounded shadow text-yellow-700 font-semibold">
            Premium features enabled
          </div>
        </div>

        {/* Map View */}
        <div className="md:w-2/3 w-full h-[450px] bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🗺️ Live Map</h2>
          <MapContainer center={[0.0236, 37.9062]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {geoJson && <GeoJSON data={geoJson} />}
          </MapContainer>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-2">📈 Climate Trends (Line Chart)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0EA5E9" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart Section */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-2">📊 Premium Insights (Bar Chart)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#34D399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dataset Table */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">🗃️ Uploaded Datasets</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Uploader</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(datasets) &&
              datasets.map((dataset) => (
                <tr key={dataset._id}>
                  <td className="border px-4 py-2">{dataset.name}</td>
                  <td className="border px-4 py-2">{dataset.uploader}</td>
                  <td className="border px-4 py-2">
                    {new Date(dataset.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">{dataset.status || "Active"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
