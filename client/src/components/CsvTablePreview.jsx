import React, { useState } from "react";

export default function CsvTablePreview({ data, geojsonData }) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (type) => {
    try {
      setDownloading(true);
      const res = await fetch(`http://localhost:8000/export/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geojsonData),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = type === "csv" ? "dataset.csv" : "dataset.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setDownloading(false);
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">📄 CSV Preview</h3>

      <table className="table-auto w-full text-sm">
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key} className="border px-2 py-1 bg-gray-100">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j} className="border px-2 py-1">{val?.toString()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => handleExport("csv")}
          disabled={downloading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download as CSV
        </button>
        <button
          onClick={() => handleExport("shapefile")}
          disabled={downloading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Download as Shapefile
        </button>
      </div>
    </div>
  );
}
