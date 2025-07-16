import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser, useAuth } from "@clerk/clerk-react";
import * as shp from "shpjs";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [geoJson, setGeoJson] = useState(null);
  const [rasterMeta, setRasterMeta] = useState(null);
  const [rasterPreview, setRasterPreview] = useState(null);
  const [geoJsonLayer, setGeoJsonLayer] = useState(null);


  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchDatasets = async () => {
    const res = await fetch("http://localhost:5000/api/datasets");
    const data = await res.json();
    setDatasets(data);
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSpecialFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    if (file.name.endsWith(".shp")) {
      const res = await fetch("http://localhost:8000/convert/shp", {
        method: "POST",
        body: formData,
      });
      const geojson = await res.json();
      if (geojson.features) setGeoJson(geojson);
    } else if (file.name.endsWith(".tif")) {
      const res = await fetch("http://localhost:8000/preview/raster", {
        method: "POST",
        body: formData,
      });
      const { meta, preview } = await res.json();
      setRasterMeta(meta);
      setRasterPreview(`http://localhost:8000/${preview}`);
    }
  };

  const handlePreview = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const ext = selectedFile.name.split(".").pop();

    if (ext === "csv") {
      Papa.parse(selectedFile, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setPreviewData(results.data.slice(0, 5));
          const sampleKeys = Object.keys(results.data[0] || {});
          if (sampleKeys.length >= 2) {
            const sampleChartData = results.data.slice(0, 10).map((row) => ({
              name: row[sampleKeys[0]],
              value: row[sampleKeys[1]],
            }));
            setChartData(sampleChartData);
          }
        },
      });
    } else if (["shp", "tif"].includes(ext)) {
      await handleSpecialFile(selectedFile);
    }

    if (selectedFile.name.endsWith(".geojson") || selectedFile.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = JSON.parse(e.target.result);
        setGeoJsonLayer(content);
      };
      reader.readAsText(selectedFile);
    }

    if (selectedFile.name.endsWith(".zip")) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const geojson = await shp(e.target.result);
        setGeoJsonLayer({ type: "FeatureCollection", features: geojson.features || geojson });
      };
      reader.readAsArrayBuffer(selectedFile);
    }

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return toast.error("📂 File and title are required");

    const formData = new FormData();
    formData.append("file", file);

    let fileUrl = "";
    let fileType = file.name.split(".").pop();

    try {
      const uploadRes = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      fileUrl = uploadData.url || uploadData.fileUrl;
    } catch (err) {
      console.error(err);
      return toast.error("❌ File upload failed");
    }

    const token = await getToken();
    try {
      const res = await fetch(
        `http://localhost:5000/api/datasets${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            category,
            fileUrl,
            fileType,
          }),
        }
      );

      if (res.ok) {
        toast.success(editingId ? "✅ Dataset updated" : "✅ Dataset uploaded!");
        setFile(null);
        setTitle("");
        setCategory("");
        setDescription("");
        setEditingId(null);
        setPreviewData([]);
        setChartData([]);
        setGeoJson(null);
        setRasterMeta(null);
        setRasterPreview(null);
        fetchDatasets();
      } else {
        toast.error("❌ Upload failed. Check server.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Network error during upload");
    }
  };

  const handleDelete = async (id) => {
    const token = await getToken();
    const confirmed = confirm("Are you sure you want to delete this dataset?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/datasets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("🗑️ Dataset deleted");
        fetchDatasets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadFile = async (dataset) => {
    try {
      const res = await fetch(dataset.fileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.title}.${dataset.fileType || "json"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("❌ Download failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">📊 Upload Climate Dataset</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          accept=".csv, .xlsx, .xls, .geojson, .json, .shp, .tif"
          onChange={handlePreview}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Dataset Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          <option value="climate">Climate</option>
          <option value="disaster">Disaster Risk</option>
          <option value="vulnerability">Vulnerability</option>
        </select>
        <textarea
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {editingId ? "Update Dataset" : "Upload Dataset"}
        </button>
      </form>

      {/* CSV Preview */}
      {previewData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">📄 CSV Preview</h3>
          <table className="table-auto w-full text-sm">
            <thead>
              <tr>
                {Object.keys(previewData[0]).map((key) => (
                  <th key={key} className="border px-2 py-1 bg-gray-100">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border px-2 py-1">
                      {val?.toString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">📊 Auto Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Raster Preview */}
      {rasterPreview && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">🖼️ Raster Preview</h3>
          <img src={rasterPreview} alt="GeoTIFF Preview" className="border rounded" />
          <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
            {JSON.stringify(rasterMeta, null, 2)}
          </pre>
        </div>
      )}

      {/* Dataset Table */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-2">📁 Uploaded Datasets</h3>
        <table className="w-full table-auto border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Actions</th>
              <th className="p-2 border">Download</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d._id}>
                <td className="p-2 border">{d.title}</td>
                <td className="p-2 border capitalize">{d.category}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => {
                      setTitle(d.title);
                      setCategory(d.category);
                      setDescription(d.description);
                      setEditingId(d._id);
                    }}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
                <td className="p-2 border text-blue-700">
                  <button onClick={() => downloadFile(d)}>⬇ Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      // Map Preview
      {geoJsonLayer && (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">🗺️ Map Preview</h3>
        <MapContainer center={[0.0236, 37.9062]} zoom={5} style={{ height: "400px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={geoJsonLayer} />
        </MapContainer>
      </div>
    )}


      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
