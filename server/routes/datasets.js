import express from "express";
import Dataset from "../models/Dataset.js";
import { requireClerkAuth } from "../middleware/requireClerkAuth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { convertToCSV } from "../utils/csv.js";
import clerk from "../utils/clerkAdmin.js";
import * as turf from '@turf/turf';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';

const router = express.Router();


// 🟢 Upload a new dataset (requires authentication)
router.post("/", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const { title, description, category, fileUrl, fileType, geoBounds } = req.body;
    const { userId } = getAuth(req);
    
    // Get user info if needed
    let username = "Unknown";
    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.firstName || user.lastName || user.username || "Unknown";
      } catch (userError) {
        console.error("Error fetching user info:", userError);
        // Fallback to req.user if available
        username = req.user?.username || req.user?.name || "Unknown";
      }
    }

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

// 🟡 Get all datasets with optional filters (public)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;
  const { bbox, q } = req.query;

  const query = {};

  // Text search filter
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ];
  }

  // Bounding box spatial filter
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    query["geojson.geometry"] = {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat] // Close polygon ring
          ]]
        }
      }
    };
  }

  try {
    const [datasets, total] = await Promise.all([
      Dataset.find(query).skip(skip).limit(limit),
      Dataset.countDocuments(query)
    ]);

    res.json({
      datasets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Failed to fetch datasets:", err);
    res.status(500).json({ message: "Failed to fetch datasets." });
  }
});

// PATCH: Update a dataset (requires auth)
router.patch("/:id", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const updated = await Dataset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔴 Delete dataset (only uploader can delete)
router.delete("/:id", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const { userId } = getAuth(req);
    if (dataset.uploadedBy !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this dataset" });
    }

    await dataset.deleteOne();
    res.json({ message: "✅ Dataset deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export datasets as GeoJSON or CSV (public)
router.get("/export", async (req, res) => {
  const { format = "geojson", bbox } = req.query;

  const query = bbox
    ? { 
        location: { 
          $geoWithin: { 
            $geometry: turf.bboxPolygon(JSON.parse(bbox)).geometry 
          } 
        } 
      }
    : {};

  try {
    const datasets = await Dataset.find(query);

    if (format === "csv") {
      const csv = convertToCSV(datasets);
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    } else {
      res.json({
        type: "FeatureCollection",
        features: datasets.map(d => ({
          type: "Feature",
          geometry: d.location,
          properties: {
            ...d.toObject(),
            location: undefined,
          }
        }))
      });
    }
  } catch (err) {
    console.error("Export failed:", err);
    res.status(500).json({ message: "Failed to export datasets." });
  }
});

// Secure route - requires logged in user
router.get("/secure", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    let user = null;
    
    if (userId) {
      try {
        user = await clerkClient.users.getUser(userId);
      } catch (userError) {
        console.error("Error fetching user info:", userError);
      }
    }
    
    const name = user?.firstName || user?.lastName || req.user?.name || 'User';
    res.json({ message: `Hello, ${name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only route
router.get("/admin-only", requireClerkAuth, requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

// Public route, optionally authenticated
router.get("/public", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        const name = user?.firstName || user?.lastName || 'User';
        return res.json({ message: `Welcome back, ${name}` });
      } catch (userError) {
        console.error("Error fetching user info:", userError);
        // Fallback to req.user if available
        const name = req.user?.firstName || req.user?.name || 'User';
        return res.json({ message: `Welcome back, ${name}` });
      }
    }
    
    res.json({ message: "Welcome, guest!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;