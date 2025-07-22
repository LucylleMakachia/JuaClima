import mongoose from "mongoose";

const SavedFilterSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, default: "Unnamed Filter" },
  geometry: { type: Object, required: true }, // GeoJSON Feature or Polygon
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SavedFilter", SavedFilterSchema);
