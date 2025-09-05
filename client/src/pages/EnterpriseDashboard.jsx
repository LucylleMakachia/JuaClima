// src/pages/EnterpriseDashboard.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import WeatherCards from "../components/WeatherCards";

const { BaseLayer, Overlay } = LayersControl;

const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function EnterpriseDashboard() {
  const [geoJson, setGeoJson] = useState(null);
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    axios.get("/api/geojson").then((res) => setGeoJson(res.data));
    axios.get("/api/lineChartData").then((res) => setLineChartData(res.data));
    axios.get("/api/barChartData").then((res) => setBarChartData(res.data));
    axios.get("/api/pieChartData").then((res) => setPieChartData(res.data));
    axios.get("/api/datasets").then((res) => setDatasets(res.data));
  }, []);

  return (
    <div className="max-w-8xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-700">
        🚀 Enterprise Climate Dashboard
      </h1>

      {/* Weather Cards + Layered Map */}
      <div className="flex flex-col lg:flex-row gap-10 mb-12">
        <div className="lg:w-1/4 w-full space-y-6">
          <WeatherCards enterprise />
        </div>

        <div className="lg:w-3/4 w-full h-[500px] bg-white p-6 rounded shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">🗺️ Interactive Multi-layer Map</h2>
          <MapContainer center={[0.0236, 37.9062]} zoom={7} style={{ height: "100%", width: "100%" }}>
            <LayersControl position="topright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
              </BaseLayer>
              <BaseLayer name="Satellite">
                <TileLayer
                  url="https://{s}.satellite-provider.com/{z}/{x}/{y}.jpg"
                  attribution="&copy; Satellite Data Provider"
                />
              </BaseLayer>
              {geoJson && (
                <Overlay checked name="Climate Risk Zones">
                  <GeoJSON data={geoJson} style={{ color: "#f97316", weight: 2, fillOpacity: 0.3 }} />
                </Overlay>
              )}
            </LayersControl>
          </MapContainer>
        </div>
      </div>

      {/* Multi-chart analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        {/* Line Chart */}
        <section className="bg-white p-6 rounded shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📈 Temperature Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#6366F1" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Bar Chart */}
        <section className="bg-white p-6 rounded shadow-lg">
          <h3 className="text-xl font-semibold mb-4">🌧️ Rainfall by Region</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rainfall" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Pie Chart */}
        <section className="bg-white p-6 rounded shadow-lg">
          <h3 className="text-xl font-semibold mb-4">⚠️ Risk Category Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Dataset Table */}
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">🗃️ Enterprise Datasets & Reports</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-indigo-100 text-left">
              <th className="border px-6 py-4">Name</th>
              <th className="border px-6 py-4">Uploader</th>
              <th className="border px-6 py-4">Category</th>
              <th className="border px-6 py-4">Status</th>
              <th className="border px-6 py-4">Date Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(datasets) &&
              datasets.map((dataset) => (
                <tr key={dataset._id}>
                  <td className="border px-6 py-4">{dataset.name}</td>
                  <td className="border px-6 py-4">{dataset.uploader}</td>
                  <td className="border px-6 py-4">{dataset.category || "N/A"}</td>
                  <td className="border px-6 py-4">{dataset.status || "Active"}</td>
                  <td className="border px-6 py-4">{new Date(dataset.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
