import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [geoJson, setGeoJson] = useState(null);
  const [csvChart, setCsvChart] = useState([]);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", category: "", description: "" });

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/api/datasets");
      const data = await res.json();
      setDatasets(data);

      const geoFile = data.find(d => d.fileUrl.endsWith(".geojson") || d.fileUrl.endsWith(".json"));
      if (geoFile) {
        const geoRes = await fetch(geoFile.fileUrl);
        const geoData = await geoRes.json();
        setGeoJson(geoData);
      }

      const csvFile = data.find(d => d.fileUrl.endsWith(".csv"));
      if (csvFile) {
        const csvRes = await fetch(csvFile.fileUrl);
        const csvText = await csvRes.text();
        const parsed = Papa.parse(csvText, { header: true });
        setCsvChart(parsed.data.slice(0, 20)); // Limit to 20 rows
      }
    };
    fetchData();
  }, []);

  const handleEdit = (dataset) => {
    setEditingId(dataset._id);
    setEditForm({
      title: dataset.title,
      category: dataset.category,
      description: dataset.description,
    });
  };

  const handleSaveEdit = async (id) => {
    const res = await fetch(`http://localhost:5000/api/datasets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      const updated = await res.json();
      setDatasets(prev => prev.map(d => d._id === id ? updated : d));
      setEditingId(null);
    }
  };

  const filtered = datasets.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  ).filter(d => !userFilter || d.uploadedBy === userFilter);

  const users = [...new Set(datasets.map(d => d.uploadedBy).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Climate Dashboard</h1>

      {/* Search + User Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search datasets"
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3"
        >
          <option value="">All Users</option>
          {users.map((user, i) => (
            <option key={i} value={user}>{user}</option>
          ))}
        </select>
      </div>

      {/* Summary Bar Chart */}
      <div className="mb-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">📈 Dataset Summary</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={Object.entries(
              datasets.reduce((acc, d) => {
                acc[d.category] = (acc[d.category] || 0) + 1;
                return acc;
              }, {})
            ).map(([name, count]) => ({ name, count }))}
          >
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
        <table className="w-full table-auto border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Link</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d._id}>
                <td className="p-2 border">
                  {editingId === d._id ? (
                    <input
                      className="border p-1 rounded"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  ) : d.title}
                </td>
                <td className="p-2 border">
                  {editingId === d._id ? (
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="border p-1 rounded"
                    >
                      <option value="climate">Climate</option>
                      <option value="health">Health</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="energy">Energy</option>
                      <option value="other">Other</option>
                    </select>
                  ) : d.category}
                </td>
                <td className="p-2 border">{d.uploadedBy}</td>
                <td className="p-2 border text-blue-600 underline">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer">View</a>
                </td>
                <td className="p-2 border">
                  {editingId === d._id ? (
                    <>
                      <button onClick={() => handleSaveEdit(d._id)} className="text-green-600 mr-2">💾 Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500">✖ Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => handleEdit(d)} className="text-blue-600">✏️ Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GeoJSON Map */}
      {geoJson && (
        <div className="bg-white p-4 rounded shadow mb-8">
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

      {/* CSV Chart */}
      {csvChart.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">📊 CSV Sample Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={csvChart}>
              <XAxis dataKey={Object.keys(csvChart[0])[0]} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={Object.keys(csvChart[0])[1]} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
