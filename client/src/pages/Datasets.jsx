import React, { useEffect, useState } from "react";
import { getAllDatasets } from "../services/datasetService";
import DatasetCard from "../components/DatasetCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "@clerk/clerk-react";
import ErrorBoundary from "../components/ErrorBoundary";
import InteractiveMap from "../components/InteractiveMap";

function DatasetsContent() {
  const { isSignedIn } = useUser();
  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all datasets on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllDatasets();
        const datasetArray = Array.isArray(result)
          ? result
          : result.datasets || [];
        setDatasets(datasetArray);
        setFiltered(datasetArray);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Global Climate Datasets
            </h1>
            <p className="text-blue-100 text-lg">
              Click anywhere on the map to get real-time weather data
            </p>
          </div>
        </div>

        {/* Map + Dataset Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map */}
            <div className="w-full lg:w-1/3">
              <InteractiveMap datasets={datasets} setFiltered={setFiltered} />
            </div>

            {/* Dataset Cards */}
            <div className="w-full lg:w-2/3">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {filtered.length && filtered[0]?.isCustomLocation
                    ? "Location Weather Data"
                    : "Available Datasets"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {filtered.length} dataset{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading climate datasets...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered
                    .filter((d) => d && d._id)
                    .map((d) => (
                      <DatasetCard
                        key={d._id}
                        dataset={d}
                        canDownload={isSignedIn}
                      />
                    ))}
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

export default function Datasets() {
  return (
    <ErrorBoundary>
      <DatasetsContent />
    </ErrorBoundary>
  );
}
