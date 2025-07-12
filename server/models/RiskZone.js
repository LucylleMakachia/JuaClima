import mongoose from "mongoose";

const RiskZoneSchema = new mongoose.Schema({
  name: String,
  riskLevel: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("RiskZone", RiskZoneSchema);