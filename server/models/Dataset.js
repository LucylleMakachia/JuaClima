import mongoose from "mongoose";

const DatasetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Dataset title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "climate",
        "health",
        "agriculture",
        "energy",
        "food",
        "mental health",
        "urban planning",
        "other",
      ],
      default: "other",
      index: true, // indexed for faster queries by category
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
      // Optional URL validation using regex
      match: [
        /^https?:\/\/.+/,
        "File URL must be a valid HTTP or HTTPS URL",
      ],
    },
    originalFilename: {
      type: String,
      trim: true,
      default: "",
    },
    fileType: {
      type: String,
      enum: ["csv", "json", "geojson", "xlsx"],
      required: [true, "File type is required"],
      lowercase: true,
      trim: true,
    },
    uploadedBy: {
      userId: { type: String, index: true, required: true },
      username: { type: String, trim: true, default: "" },
    },
    geoBounds: {
      type: {
        type: String,
        enum: ["FeatureCollection", "Feature"],
        default: "FeatureCollection",
      },
      features: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Geospatial index for spatial queries
DatasetSchema.index({ geoBounds: "2dsphere" });

export default mongoose.model("Dataset", DatasetSchema);
