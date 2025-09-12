import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function FilterSidebar({ isOpen, onClose, onApply }) {
  const [regions, setRegions] = useState([]);
  const [themes, setThemes] = useState([]);
  const [timeRanges, setTimeRanges] = useState([
    "Last 7 Days",
    "Last 30 Days",
    "Last Year",
  ]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("");

  // Fetch dynamic filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [regionsRes, themesRes] = await Promise.all([
          axios.get("/api/filters/regions"),
          axios.get("/api/filters/themes"),
        ]);
        setRegions(regionsRes.data || []);
        setThemes(themesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    };
    fetchFilters();
  }, []);

  const handleApply = () => {
    onApply?.({
      region: selectedRegion,
      theme: selectedTheme,
      timeRange: selectedTimeRange,
    });
    onClose();
  };

  return (
    <aside
      className={`fixed md:static top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-30 rounded-r-2xl md:rounded-none ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Filters
        </h2>
        <button
          className="md:hidden hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-4">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full p-2 border rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-green-400"
        >
          <option value="">Select Region</option>
          {regions.map((r, i) => (
            <option key={i} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="w-full p-2 border rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-green-400"
        >
          <option value="">Select Theme</option>
          {themes.map((t, i) => (
            <option key={i} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="w-full p-2 border rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-green-400"
        >
          <option value="">Select Time Range</option>
          {timeRanges.map((tr, i) => (
            <option key={i} value={tr}>
              {tr}
            </option>
          ))}
        </select>

        <Button
          onClick={handleApply}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md"
        >
          Apply Filters
        </Button>
      </div>
    </aside>
  );
}
