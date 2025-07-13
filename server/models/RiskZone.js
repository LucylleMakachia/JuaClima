import mongoose from "mongoose";

const RiskZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  riskLevel: { type: String, enum: ["Low", "Medium", "High"], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
});

export default mongoose.model("RiskZone", RiskZoneSchema);
