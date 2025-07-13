import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const fetchZones = () => api.get("/risk-zones");
export const postZone = (data) => api.post("/risk-zones", data); 
