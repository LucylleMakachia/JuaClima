import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";
import * as turf from "@turf/turf";

import DatasetCard from "../components/DatasetCard";
import LocationSearch from "../components/LocationSearch";
import Loading from "../components/Loading";
import Error from "../components/Error";
import { getDatasets } from "../services/api";

import { EditControl } from "react-leaflet-draw";

export default function Datasets() {
  const mapRef = useRef();
  const drawRef = useRef();

  const [datasets, setDatasets] = useState([]);
  const [page, setPage] = useState(1);
  const [filtered, setFiltered] = useState([]);
  const [filterShapes, setFilterShapes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(6);
  const [query, setQuery] = useState("");

  const [savedFilters, setSavedFilters] = useState([]);
  const isPremium = true;
  const userToken = ""; // Use real token in prod

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
);

  const handleExport = async (format) => {
  const url = new URL("/api/datasets/export", window.location.origin);
  url.searchParams.set("format", format);
  if (bounds) url.searchParams.set("bbox", JSON.stringify(bounds));
  
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `datasets.${format === "csv" ? "csv" : "geojson"}`;
  link.click();
};



  // Fetch datasets
  useEffect(() => {
    getDatasets()
      .then((res) => {
        setDatasets(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load datasets");
        setLoading(false);
      });
  }, []);

  // Load filter shapes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("filterShapes");
    if (saved) {
      try {
        setFilterShapes(JSON.parse(saved));
      } catch {
        console.warn("Invalid saved shapes");
      }
    }
  }, []);

  // Fetch paginated datasets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDatasets({
          page,
          limit,
          bbox: bounds,
          query
        });
        setDatasets(data.datasets);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [page, bounds, limit, query]);



  // Apply spatial filtering using Turf
  useEffect(() => {
    if (!filterShapes || datasets.length === 0) {
      setFiltered(datasets);
      return;
    }

    setCurrentPage(1);

    const filteredResults = datasets.filter((dataset) => {
      if (!dataset.geojson) return false;
      try {
        const feature =
          typeof dataset.geojson === "string"
            ? JSON.parse(dataset.geojson)
            : dataset.geojson;

        return filterShapes.features.some((shape) =>
          turf.booleanIntersects(shape, feature)
        );
      } catch {
        return false;
      }
    });

    setFiltered(filteredResults);
  }, [datasets, filterShapes]);

  // Load saved filters from backend
  useEffect(() => {
    if (!isPremium) return;

    fetch("/api/filters", {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then((res) => res.json())
      .then((data) => setSavedFilters(data))
      .catch((err) => console.warn("Failed to load saved filters", err));
  }, []);

  useEffect(() => {
  getSavedFilters().then(setSaved).catch(console.error);
}, []);


  // Draw Handlers
  const handleDrawCreated = (e) => {
    const newFeature = e.layer.toGeoJSON();
    const updated = filterShapes
      ? { ...filterShapes, features: [...filterShapes.features, newFeature] }
      : { type: "FeatureCollection", features: [newFeature] };

    setFilterShapes(updated);
    localStorage.setItem("filterShapes", JSON.stringify(updated));
  };

  const handleDrawDeleted = (e) => {
    const deletedLayers = new Set();
    e.layers.eachLayer((layer) => deletedLayers.add(layer._leaflet_id));

    const remaining = filterShapes.features.filter(
      (_, i) => !deletedLayers.has(i)
    );

    const updated = { type: "FeatureCollection", features: remaining };
    setFilterShapes(updated);
    localStorage.setItem("filterShapes", JSON.stringify(updated));
  };

  const clearFilters = () => {
    setFilterShapes(null);
    localStorage.removeItem("filterShapes");
  };

  const handleLocationSelect = ({ center }) => {
    mapRef.current?.flyTo(center, 10);
  };

  const setBoundsFromGeoJSON = (geometry) => {
    const fc = {
      type: "FeatureCollection",
      features: [geometry],
    };
    setFilterShapes(fc);
    localStorage.setItem("filterShapes", JSON.stringify(fc));
  };

  const handleSaveFilter = async () => {
    if (!filterShapes) return;

    const res = await fetch("/api/filters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "My Nairobi Polygon",
        geometry: filterShapes,
      }),
    });

    const saved = await res.json();
    setSavedFilters((prev) => [...prev, saved]);
  };

  const handleDeleteFilter = async (id) => {
    try {
      await fetch(`/api/filters/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setSavedFilters((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Error deleting filter", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Datasets (Filtered by Map Area)</h2>
        <button
          onClick={clearFilters}
          className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
        >
          Clear Filters
        </button>
      </div>

      <LocationSearch onSelect={handleLocationSelect} />

      <div className="h-96 rounded border overflow-hidden">
        <MapContainer
          ref={mapRef}
          center={[-1.286389, 36.817223]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <FeatureGroup ref={drawRef}>
            <EditControl
              position="topright"
              draw={{
                rectangle: true,
                polygon: true,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
              onCreated={handleDrawCreated}
              onDeleted={handleDrawDeleted}
            />
          </FeatureGroup>

          {savedFilters.map((f) => (
            <GeoJSON key={f._id} data={f.geometry} style={{ color: "green" }} />
          ))}
        </MapContainer>
      </div>

      {isPremium && (
        <div>
          <h3 className="font-semibold mt-4">Saved Filters</h3>
          <ul className="space-y-1 text-sm">
            {savedFilters.map((f) => (
              <li
                key={f._id}
                className="flex justify-between items-center space-x-2"
              >
                <button
                  onClick={() => setBoundsFromGeoJSON(f.geometry)}
                  className="text-blue-600 underline"
                >
                  {f.name}
                </button>
                <button
                  onClick={() => handleDeleteFilter(f._id)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSaveFilter}
            className="mt-2 bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm"
          >
            Save Current Filter
          </button>
        </div>
      )}

      {totalPages > 1 && (
  <div className="flex items-center justify-center gap-2 my-4">
    <button
      onClick={() => setPage((p) => Math.max(p - 1, 1))}
      disabled={page === 1}
      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setPage(i + 1)}
        className={`px-3 py-1 rounded ${
          page === i + 1
            ? "bg-blue-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
      disabled={page === totalPages}
      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Next
    </button>
  </div>
)} 

  <div className="mt-6">
  <h3 className="font-bold mb-2">Saved Filters</h3>
  <div className="flex gap-2 flex-wrap">
    {saved.map(filter => (
      <button
        key={filter._id}
        className="px-3 py-1 bg-green-100 rounded"
        onClick={() => {
          setBounds(turf.bbox(filter.geometry)); // Or setBoundsDirectly
          setPage(1);
        }}
      >
        {filter.name}
      </button>
    ))}
  </div>
</div>

<button
  className="px-2 py-1 bg-blue-500 text-white rounded"
  onClick={() => {
    const shape = drawnShape; // from Leaflet-draw
    const name = prompt("Name this filter?");
    saveFilter({ name, geometry: shape }).then(() => alert("Saved!"));
  }}
>
  Save This Filter
</button>



  <div className="mb-4 flex gap-2 items-center">
  <input
    type="text"
    value={query}
    onChange={(e) => {
      setQuery(e.target.value);
      setPage(1); // Reset to page 1 on search
    }}
    placeholder="Search by name or description..."
    className="border rounded px-2 py-1 w-64"
  />

  <select
    value={limit}
    onChange={(e) => {
      setLimit(Number(e.target.value));
      setPage(1);
    }}
    className="border rounded px-2 py-1"
  >
    <option value={6}>6 per page</option>
    <option value={12}>12 per page</option>
    <option value={24}>24 per page</option>
  </select>
</div>

    <div className="flex gap-2 mt-4">
      <button
        onClick={() => handleExport("csv")}
        className="bg-blue-500 text-white px-3 py-1 rounded"
  >
    Export CSV
      </button>
      <button
        onClick={() => handleExport("geojson")}
        className="bg-green-500 text-white px-3 py-1 rounded"
      >
        Export GeoJSON
      </button>
</div>


      {loading && <Loading />}
      {error && <Error message={error} />}
      {!loading && filtered.length === 0 && <p>No datasets match current filter.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((dataset) => (
          <DatasetCard key={dataset._id} dataset={dataset} />
        ))}
      </div>
    </div>
  );
}
