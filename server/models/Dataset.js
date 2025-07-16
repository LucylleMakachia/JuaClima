import mongoose from "mongoose";

const DatasetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["climate", "health", "agriculture", "energy", "other"],
      default: "other"
    },
    fileUrl: { type: String, required: true },
    originalFilename: String, // 📁 New: store original name
    fileType: {
      type: String,
      enum: ["csv", "json", "geojson", "xlsx"],
      required: true
    },
    uploadedBy: {
      userId: String,
      username: String,
    }, // 👤 Structured uploader info
    geoBounds: {
      type: {
        type: String,
        enum: ["FeatureCollection", "Feature"],
        default: "FeatureCollection"
      },
      features: Array // 🗺️ Optional for GeoJSON
    },
    username: String,
  },
  { timestamps: true }
);

export default mongoose.model("Dataset", DatasetSchema);
