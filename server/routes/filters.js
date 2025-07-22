// routes/filters.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Filter = require("../models/filter"); 

// GET all filters for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  const filters = await Filter.find({ userId: req.user.id });
  res.json(filters);
});

// POST new filter
router.post("/", requireAuth, async (req, res) => {
  const { name, geometry } = req.body;
  if (!geometry || !geometry.type) return res.status(400).json({ error: "Invalid geometry" });

  const newFilter = await Filter.create({
    userId: req.user.id,
    name,
    geometry,
  });

  res.status(201).json(newFilter);
});

// DELETE a filter
router.delete("/:id", requireAuth, async (req, res) => {
  const filter = await Filter.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!filter) return res.status(404).json({ error: "Not found" });

  res.json({ success: true });
});

// PATCH update filter name or geometry
router.patch("/:id", requireAuth, async (req, res) => {
  const { name, geometry } = req.body;
  const update = {};
  if (name) update.name = name;
  if (geometry && geometry.type) update.geometry = geometry;

  const updated = await Filter.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    update,
    { new: true }
  );

  if (!updated) return res.status(404).json({ error: "Not found" });

  res.json(updated);
});


module.exports = router;
