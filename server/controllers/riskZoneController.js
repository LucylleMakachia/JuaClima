import RiskZone from "../models/RiskZone.js";

export const getZones = async (req, res) => {
  try {
    const zones = await RiskZone.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addZone = async (req, res) => {
  try {
    const zone = new RiskZone(req.body);
    await zone.save();
    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};