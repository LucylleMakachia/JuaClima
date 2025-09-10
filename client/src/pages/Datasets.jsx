import React, { useEffect, useState, useMemo, useCallback } from "react";
import DatasetCard from "../components/DatasetCard";
import { useUser } from "@clerk/clerk-react";
import ErrorBoundary from "../components/ErrorBoundary";
import InteractiveMap from "../components/InteractiveMap";
import axios from "axios";

function DatasetsContent() {
  const { isSignedIn, user } = useUser();
  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPaidPackage, setHasPaidPackage] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null); // No default

  // Search, sort, and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("uploadedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;

  // Memoized fetchDatasets function to avoid recreating on every render
  const fetchDatasets = useCallback(async () => {
    if (!selectedCoordinates) return; // Skip fetching if coordinates not set
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/datasets/area", {
        params: {
          lat: selectedCoordinates.lat,
          lng: selectedCoordinates.lng,
        },
      });
      const datasetArray = Array.isArray(res.data.datasets) ? res.data.datasets : [];
      setDatasets(datasetArray);
      setFiltered(datasetArray);
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
      if (err.response?.status === 400) {
        setError("Invalid location parameters. Please try again.");
      } else if (err.response?.status === 401) {
        setError("Authentication required to access datasets.");
      } else if (err.response?.status === 404) {
        setError("No datasets found for this location.");
      } else {
        setError("Failed to load datasets. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCoordinates]);

  // Fetch datasets when coordinates change
  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // Memoized fetchPackageStatus function
  const fetchPackageStatus = useCallback(async () => {
    try {
      const res = await axios.get(`/api/user/${user.id}/package-status`);
      setHasPaidPackage(res.data.hasPaid || false);
    } catch (err) {
      console.error("Failed to fetch package status:", err);
      setHasPaidPackage(false);
    }
  }, [user?.id]);

  // Fetch package status when user changes
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchPackageStatus();
    } else {
      setHasPaidPackage(false);
    }
  }, [isSignedIn, user?.id, fetchPackageStatus]);

  // Memoized location select handler
  const handleLocationSelect = useCallback((filteredDatasets, coordinates) => {
    setFiltered(filteredDatasets);
    setSearchTerm("");
    setCurrentPage(1);
    if (coordinates) {
      setSelectedCoordinates(coordinates);
    }
  }, []);

  // Filter datasets based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFiltered(datasets);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filteredResults = datasets.filter(
        (d) => d.title?.toLowerCase().includes(lowerTerm) || d.description?.toLowerCase().includes(lowerTerm)
      );
      setFiltered(filteredResults);
      setCurrentPage(1);
    }
  }, [searchTerm, datasets]);

  const datasetsToDisplay = filtered.filter((d) => (d.isPrivate ? hasPaidPackage : true));

  const sortedDatasets = useMemo(() => {
    return [...datasetsToDisplay].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (!aVal) return 1;
      if (!bVal) return -1;

      if (sortKey === "source") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [datasetsToDisplay, sortKey, sortDirection]);

  const paginatedDatasets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedDatasets.slice(start, start + PAGE_SIZE);
  }, [sortedDatasets, currentPage]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">Global Climate Datasets</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Explore climate datasets and visualize them on the map.
          {hasPaidPackage && <> You have access to private datasets shared within your ecosystem.</>}
        </p>
      </header>

      {/* Map */}
      <section className="container mx-auto px-4 mb-10 relative">
        <div className="w-full rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <InteractiveMap 
            datasets={datasets} 
            setFiltered={handleLocationSelect} 
            onCoordinatesChange={setSelectedCoordinates} // Make sure InteractiveMap calls this when user selects location
          />
        </div>
      </section>

      {/* Prompt if no coordinates selected */}
      {!selectedCoordinates && (
        <p className="text-center py-8 text-gray-600">
          Please select a location on the map to load datasets.
        </p>
      )}

      {/* Controls */}
      <section className="container mx-auto px-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          aria-label="Search datasets by title or description"
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
        />
        <div className="flex items-center gap-2">
          <select
            aria-label="Sort datasets"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="uploadedAt">Upload Date</option>
            <option value="source">Source</option>
            <option value="fileSize">File Size</option>
          </select>
          <button
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            aria-label={`Toggle sort direction, current is ${sortDirection}`}
            className="px-3 py-2 border rounded"
          >
            {sortDirection === "asc" ? "⬆️" : "⬇️"}
          </button>
        </div>
      </section>

      {/* Dataset Cards */}
      <section className="container mx-auto px-4 pb-12 flex-grow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Available Datasets</h2>
          {datasetsToDisplay.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {datasetsToDisplay.length} dataset{datasetsToDisplay.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading climate datasets...</p>
            </div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">{error}</p>
        ) : paginatedDatasets.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No datasets available for the selected location or your membership level.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDatasets
              .filter((d) => d && d._id)
              .map((d) => (
                <DatasetCard
                  key={d._id}
                  dataset={d}
                  canDownload={isSignedIn && (d.isPrivate ? hasPaidPackage : true)}
                />
              ))}
          </div>
        )}

        {/* Pagination */}
        {paginatedDatasets.length > 0 && (
          <nav aria-label="Pagination" className="flex justify-center mt-8 gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded disabled:opacity-50"
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="px-3 py-2 rounded">
              Page {currentPage} of {Math.ceil(sortedDatasets.length / PAGE_SIZE)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p < Math.ceil(sortedDatasets.length / PAGE_SIZE) ? p + 1 : p
                )
              }
              disabled={currentPage >= Math.ceil(sortedDatasets.length / PAGE_SIZE)}
              className="px-3 py-2 border rounded disabled:opacity-50"
              aria-label="Next page"
            >
              Next
            </button>
          </nav>
        )}
      </section>
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
