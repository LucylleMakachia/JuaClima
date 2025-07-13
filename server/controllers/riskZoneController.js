import RiskZone from "../models/RiskZone.js";

// GET all risk zones
export const getZones = async (req, res) => {
  try {
    const zones = await RiskZone.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST new risk zone with validation
export const createRiskZone = async (req, res) => {
  const { name, riskLevel, location } = req.body;

  if (!name || !riskLevel || !location?.lat || !location?.lng) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const newZone = new RiskZone({ name, riskLevel, location });
    await newZone.save();
    res.status(201).json(newZone);
  } catch (error) {
    console.error("Error saving risk zone:", error);
    res.status(500).json({ error: "Server error." });
  }
};
