import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser, useAuth } from "@clerk/clerk-react";
import * as shp from "shpjs";
import Papa from "papaparse";

import CsvTablePreview from "../components/CsvTablePreview";
import ChartPreview from "../components/ChartPreview";
import MapPreview from "../components/MapPreview";
import RasterPreview from "../components/RasterPreview";

export default function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [geoJsonLayer, setGeoJsonLayer] = useState(null);
  const [rasterMeta, setRasterMeta] = useState(null);
  const [rasterPreview, setRasterPreview] = useState(null);

  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchDatasets = async () => {
    const res = await fetch("http://localhost:5000/api/datasets");
    const data = await res.json();
    setDatasets(data.datasets || []);
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
      if (geojson.features) setGeoJsonLayer(geojson);
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
        setGeoJsonLayer(null);
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
          accept=".csv, .xlsx, .xls, .geojson, .json, .shp, .tif, .zip"
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

      <CsvTablePreview data={previewData} />
      <ChartPreview chartData={chartData} />
      <RasterPreview previewUrl={rasterPreview} meta={rasterMeta} />
      <MapPreview geoJsonData={geoJsonLayer} />

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

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
