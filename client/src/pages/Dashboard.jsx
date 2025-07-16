import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [geoJson, setGeoJson] = useState(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchData = async () => {
    const res = await fetch("http://localhost:5000/api/datasets");
    const data = await res.json();
    setDatasets(data);

    const geoFile = data.find((d) => d.fileUrl.endsWith(".geojson") || d.fileUrl.endsWith(".json"));
    if (geoFile) {
      const geoRes = await fetch(geoFile.fileUrl);
      const geoData = await geoRes.json();
      setGeoJson(geoData);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const token = await getToken();
    if (!confirm("Are you sure you want to delete this dataset?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/datasets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("🗑️ Dataset deleted");
        fetchData();
      } else {
        toast.error("❌ Failed to delete");
      }
    } catch (err) {
      toast.error("❌ Error deleting");
      console.error(err);
    }
  };

  const categoryCounts = datasets.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(categoryCounts).map((key) => ({
    name: key,
    count: categoryCounts[key],
  }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Climate Dashboard</h1>

      {/* Summary Bar Chart */}
      <div className="mb-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">📈 Dataset Summary</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dataset Table */}
      <div className="bg-white p-4 rounded shadow mb-8 overflow-auto">
        <h2 className="text-lg font-semibold mb-2">🗂️ Uploaded Datasets</h2>
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Link</th>
              <th className="p-2 border">Actions</th>
              <th className="p-2 border">Download</th>
            </tr>
          </thead>
      <tbody>
        {datasets.map((d) => (
          <tr key={d._id}>
            <td className="p-2 border">{d.title}</td>
            <td className="p-2 border capitalize">{d.category}</td>
            <td className="p-2 border">{d.username || "Anonymous"}</td>
            <td className="p-2 border text-blue-600 underline">
              <a href={d.fileUrl} target="_blank" rel="noreferrer">
                View
              </a>
            </td>
            <td className="p-2 border">
              <button
                className="text-green-700 hover:underline"
                onClick={async () => {
                  try {
                    const res = await fetch(d.fileUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${d.title}.${d.fileType || "json"}`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("Download failed", err);
                  }
                }}
              >
                ⬇ Download
              </button>
            </td>
          </tr>
        ))}
      </tbody>

        </table>
      </div>

      {/* Map (if GeoJSON) */}
      {geoJson && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🗺️ GeoJSON Map Preview</h2>
          <MapContainer center={[0.0236, 37.9062]} zoom={5} style={{ height: "400px", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <GeoJSON data={geoJson} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
