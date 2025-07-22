import { useState } from "react";

export default function RasterExport({ datasetId }) {
  const [format, setFormat] = useState("geotiff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/raster/export?datasetId=${datasetId}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const fileExtension = format === "png" ? "png" : "tif";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `raster_export.${fileExtension}`;
      link.click();
    } catch (e) {
      setError("Failed to export raster file.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium text-sm text-gray-700">
        Export Raster As:
      </label>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="border rounded px-2 py-1 w-full"
      >
        <option value="geotiff">GeoTIFF (.tif)</option>
        <option value="png">PNG (.png)</option>
      </select>

      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Exporting..." : "Download"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
