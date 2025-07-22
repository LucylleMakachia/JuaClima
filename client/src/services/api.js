import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const fetchZones = () => api.get("/risk-zones");
export const postZone = (data) => api.post("/risk-zones", data); 


export async function getDatasets({ page = 1, limit = 6, bbox = null, query = "" }) {
  const params = new URLSearchParams({ page, limit });

  if (bbox) {
    const flatBbox = bbox.flat().join(",");
    params.append("bbox", flatBbox);
  }

  if (query) params.append("q", query);

  const res = await fetch(`/api/datasets?${params}`);
  if (!res.ok) throw new Error("Failed to load datasets.");
  return res.json();
}

export async function getSavedFilters() {
  const res = await fetch("/api/filters");
  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

export async function saveFilter({ name, geometry }) {
  const res = await fetch("/api/filters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, geometry })
  });
  if (!res.ok) throw new Error("Failed to save filter");
  return res.json();
}

export async function deleteFilter(id) {
  const res = await fetch(`/api/filters/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete filter");
  return res.json();
}
