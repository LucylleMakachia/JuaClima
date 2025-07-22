import express from "express";
import SavedFilter from "../models/SavedFilter.js";
const router = express.Router();

// GET all filters for current user
router.get("/", async (req, res) => {
  try {
    const filters = await SavedFilter.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(filters);
  } catch (err) {
    res.status(500).json({ message: "Error fetching filters." });
  }
});

// POST new filter
router.post("/", async (req, res) => {
  try {
    const { name, geometry } = req.body;
    const filter = await SavedFilter.create({
      userId: req.userId,
      name,
      geometry
    });
    res.status(201).json(filter);
  } catch (err) {
    res.status(500).json({ message: "Error saving filter." });
  }
});

// DELETE a filter
router.delete("/:id", async (req, res) => {
  try {
    await SavedFilter.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Filter deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting filter." });
  }
});

export default router;
