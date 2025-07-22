import React, { useState } from "react";


function ExportPanel({ geojsonData }) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (type) => {
    try {
      setDownloading(true);
      const res = await fetch(`http://localhost:8000/export/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div style={{ marginTop: "1rem" }}>
      <button onClick={() => handleExport("csv")} disabled={downloading}>
        Download as CSV
      </button>
      <button onClick={() => handleExport("shapefile")} disabled={downloading}>
        Download as Shapefile
      </button>
    </div>
  );
}


export default ExportPanel;
