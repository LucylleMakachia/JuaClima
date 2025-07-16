import express from "express";
import Dataset from "../models/Dataset.js";
import { requireClerkAuth } from "../middleware/requireClerkAuth.js";
import { clerkClient } from "@clerk/backend";
import bbox from '@turf/bbox';
import * as shp from 'shpjs';

const router = express.Router();

// 🟢 Upload a new dataset (Clerk-protected)
router.post("/", requireClerkAuth, async (req, res) => {
  try {
    const { title, description, category, fileUrl, fileType, geoBounds } = req.body;
    const userId = req.user.sub;

    const user = await clerkClient.users.getUser(userId);
    const username = user?.username || user?.firstName || "Unknown";

    const dataset = await Dataset.create({
      title,
      description,
      category,
      fileUrl,
      fileType,
      geoBounds,
      uploadedBy: userId,
      username,
    });

    res.status(201).json(dataset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟡 Get all datasets with optional filters
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const query = category ? { category } : {};

    const datasets = await Dataset.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Dataset.countDocuments(query);
    res.json({ datasets, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Update a dataset
router.patch("/:id", requireClerkAuth, async (req, res) => {
  try {
    const updated = await Dataset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔴 Delete dataset (only if uploader matches)
router.delete("/:id", requireClerkAuth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (dataset.uploadedBy !== req.user.sub) {
      return res.status(403).json({ error: "Unauthorized to delete this dataset" });
    }

    await dataset.deleteOne();
    res.json({ message: "✅ Dataset deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
