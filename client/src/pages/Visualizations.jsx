import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import { motion } from "framer-motion";
import { LineChart, BarChart, PieChart } from "recharts"; // Example charts
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const sampleChartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 200 },
];

const sampleMapMarkers = [
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, region: "Nairobi", risk: "High" },
  { name: "Mombasa", lat: -4.0435, lng: 39.6682, region: "Mombasa", risk: "Medium" },
  { name: "Kisumu", lat: -0.0917, lng: 34.7680, region: "Kisumu", risk: "Low" },
];

function VisualizationCard({ index }) {
  const [chartType, setChartType] = useState("line");
  const [comment, setComment] = useState("");

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <BarChart width={300} height={150} data={sampleChartData} />;
      case "pie":
        return <PieChart width={300} height={150} data={sampleChartData} />;
      default:
        return <LineChart width={300} height={150} data={sampleChartData} />;
    }
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card className="flex flex-col rounded-2xl shadow-md hover:shadow-xl transition transform">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Visualization {index}</CardTitle>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border rounded-xl p-1 text-sm"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </CardHeader>
        <CardContent className="flex-grow flex justify-center items-center">
          {renderChart()}
        </CardContent>

        {/* Export Buttons */}
        <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
          <div className="flex gap-2">
            {["PNG", "CSV", "PDF"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                className="transition transform hover:-translate-y-1 hover:scale-105 hover:bg-green-100 dark:hover:bg-gray-700 active:scale-95"
              >
                Export {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="p-4">
          <h4 className="font-medium mb-2">Comments</h4>
          <div className="space-y-2 text-sm">
            <p className="bg-green-50 dark:bg-gray-800 p-2 rounded-xl">
              🌱 Great insights! – User123
            </p>
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:shadow-lg transition transform duration-200 hover:scale-101"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function RiskMap() {
  const [regionFilter, setRegionFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const filteredMarkers = sampleMapMarkers.filter((m) => {
    return (
      (regionFilter === "All" || m.region === regionFilter) &&
      (riskFilter === "All" || m.risk === riskFilter)
    );
  });

  const resetFilters = () => {
    setRegionFilter("All");
    setRiskFilter("All");
  };

  return (
    <div className="mb-10 relative">
      {/* Sticky Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="sticky top-4 z-20 flex gap-2 mb-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="p-2 border rounded-xl dark:bg-gray-700"
        >
          <option>All</option>
          <option>Nairobi</option>
          <option>Mombasa</option>
          <option>Kisumu</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="p-2 border rounded-xl dark:bg-gray-700"
        >
          <option>All</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <Button
          onClick={resetFilters}
          className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md"
        >
          Reset Filters
        </Button>
      </motion.div>

      {/* Map */}
      <MapContainer center={[-1.2921, 36.8219]} zoom={6} className="h-64 w-full rounded-xl">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {filteredMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]}>
            <Popup>
              {m.name} – {m.risk} risk
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function Visualizations() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex">
      <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      <div className="flex-1 p-6">
        {/* Breadcrumb */}
        <motion.nav
          className="text-sm mb-4 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ol className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <li>
              <Link to="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-700 dark:text-gray-200 font-medium">Visualizations</li>
          </ol>
          <button
            className="md:hidden flex items-center gap-1 px-3 py-2 border rounded-full text-sm bg-white dark:bg-gray-800 shadow hover:shadow-lg"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </motion.nav>

        {/* Header */}
        <motion.header
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl font-extrabold text-green-600 dark:text-green-400">
            Climate Visualizations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore climate risks, trends, and impacts across Kenya and beyond.
          </p>
        </motion.header>

        {/* Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Active Risk Zones", value: "12" },
            { title: "Communities Affected", value: "24K+" },
            { title: "Recent Events", value: "8" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="rounded-2xl shadow-md hover:shadow-xl hover:scale-102 transition transform">
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Map */}
        <RiskMap />

        {/* Visualization Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <VisualizationCard key={i} index={i} />
          ))}
        </section>

        {/* Community Stories */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Community Stories</h2>
          <div className="space-y-4">
            {[
              "🌊 “During the recent floods, our village used early warnings from JuaClima to prepare evacuation plans.” – Aisha, Kisumu",
              "🌾 “Accessing localized drought data helped us manage our irrigation better.” – Peter, Machakos"
            ].map((story, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="rounded-2xl shadow-md hover:shadow-xl transition transform">
                  <CardContent className="p-4"><p>{story}</p></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
