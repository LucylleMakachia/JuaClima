const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  geometry: { type: Object, required: true }, // GeoJSON
}, { timestamps: true });

module.exports = mongoose.model("Filter", filterSchema);
