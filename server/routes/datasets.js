import express from "express";
import Dataset from "../models/Dataset.js";
import { requireClerkAuth } from "../middleware/requireClerkAuth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { convertToCSV } from "../utils/csv.js";
import * as turf from "@turf/turf";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { body, param, validationResult } from "express-validator";

import rateLimit from "express-rate-limit";
import winston from "winston";

import { fetchCombinedClimateData } from "../services/climateAggregatorService.js";

const router = express.Router();

// Winston logger setup (basic)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

// Rate limiter for import-climate route
const importClimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "Too many import requests from this IP, please try again later.",
});

// Helper: safely get username fallback
const getUsernameFallback = (req) =>
  req.user?.username || req.user?.name || "Unknown";

// Common validation error middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Validation rules for creating a dataset
const createDatasetValidationRules = [
  body("title")
    .exists({ checkFalsy: true })
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .isLength({ max: 255 })
    .withMessage("Title is too long"),
  body("fileUrl")
    .exists({ checkFalsy: true })
    .withMessage("File URL is required")
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Invalid URL")
    .trim(),
  body("fileType")
    .exists({ checkFalsy: true })
    .withMessage("File type is required")
    .isIn(["csv", "json", "geojson", "xlsx"])
    .withMessage("Invalid file type"),
  body("category")
    .optional()
    .isIn([
      "climate",
      "health",
      "agriculture",
      "energy",
      "food",
      "mental health",
      "urban planning",
      "other",
    ])
    .withMessage("Invalid category"),
  body("description").optional().isString().trim().isLength({ max: 1000 }),
];

// Validation rules for updating a dataset (PATCH)
const updateDatasetValidationRules = [
  param("id")
    .exists()
    .withMessage("Dataset ID is required")
    .isMongoId()
    .withMessage("Invalid dataset ID"),
  body("title").optional().isString().trim().isLength({ max: 255 }),
  body("fileUrl").optional().isURL({ protocols: ["http", "https"] }),
  body("fileType").optional().isIn(["csv", "json", "geojson", "xlsx"]),
  body("category")
    .optional()
    .isIn([
      "climate",
      "health",
      "agriculture",
      "energy",
      "food",
      "mental health",
      "urban planning",
      "other",
    ]),
];

// 🟢 Upload a new dataset (requires authentication)
router.post(
  "/",
  requireClerkAuth,
  requireAuth,
  createDatasetValidationRules,
  validate,
  async (req, res) => {
    try {
      const { title, description, category, fileUrl, fileType, geoBounds } = req.body;
      const { userId } = getAuth(req);

      let username = "Unknown";
      if (userId) {
        try {
          const user = await clerkClient.users.getUser(userId);
          username = user.firstName || user.lastName || user.username || "Unknown";
        } catch (userError) {
          logger.error("User fetch error", { error: userError });
          username = getUsernameFallback(req);
        }
      }

      const dataset = await Dataset.create({
        title,
        description,
        category,
        fileUrl,
        fileType,
        geoBounds,
        uploadedBy: { userId, username },
        username,
      });

      res.status(201).json(dataset);
    } catch (err) {
      logger.error("Error creating dataset", { error: err });
      res.status(500).json({ error: "Failed to create dataset." });
    }
  }
);

// 🟢 Import climate datasets using unified climate data service
router.post(
  "/import-climate",
  importClimateLimiter,
  requireClerkAuth,
  requireAuth,
  body("lat").exists().isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
  body("lon").exists().isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
  body("startDate").exists().isISO8601().withMessage("Valid start date (ISO8601) is required"),
  body("endDate").exists().isISO8601().withMessage("Valid end date (ISO8601) is required"),
  body("title").exists().isString().trim().notEmpty().withMessage("Title is required"),
  validate,
  async (req, res) => {
    try {
      const { lat, lon, startDate, endDate, title } = req.body;
      const { userId } = getAuth(req);

      let username = "Unknown";
      if (userId) {
        try {
          const user = await clerkClient.users.getUser(userId);
          username = user.firstName || user.lastName || user.username || "Unknown";
        } catch {
          username = getUsernameFallback(req);
        }
      }

      // Fetch combined climate data from external APIs
      const climateData = await fetchCombinedClimateData(lat, lon, startDate, endDate);

      // Save imported data as a new Dataset document
      const dataset = await Dataset.create({
        title,
        description: `Imported climate data from ${startDate} to ${endDate}`,
        category: "climate",
        fileUrl: "",
        fileType: "json",
        geoBounds: {},
        uploadedBy: { userId, username },
        username,
        data: climateData, // assumes schema has 'data' field for raw JSON
      });

      res.status(201).json({
        message: "Climate data imported successfully",
        dataset,
      });
    } catch (err) {
      logger.error("Failed to import climate data", { error: err });
      res.status(500).json({ error: "Failed to import climate data." });
    }
  }
);

// 🟡 Get all datasets with search and bbox filters (public endpoint)
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 6, 50);
  const skip = (page - 1) * limit;
  const { bbox, q } = req.query;

  const query = {};

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    if ([minLng, minLat, maxLng, maxLat].some(isNaN) || minLng >= maxLng || minLat >= maxLat) {
      return res.status(400).json({ error: "Invalid bbox parameter" });
    }
    query["geoBounds"] = {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat], // close ring
            ],
          ],
        },
      },
    };
  }

  try {
    const [datasets, total] = await Promise.all([
      Dataset.find(query).skip(skip).limit(limit),
      Dataset.countDocuments(query),
    ]);

    res.json({
      datasets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error("Failed to fetch datasets", { error: err });
    res.status(500).json({ error: "Failed to fetch datasets." });
  }
});

// 🟢 New GET /area route for spatial radius search (real data return with enrichment)
router.get("/area", async (req, res) => {
  try {
    const { lat, lon, radius = 50 } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = Math.min(Math.max(parseFloat(radius) || 50, 1), 500); // limit between 1-500 km

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }

    // Earth radius ~6378.1km
    const radiusInRadians = radiusKm / 6378.1;

    // Query datasets within the spherical radius on geoBounds field
    const datasets = await Dataset.find({
      geoBounds: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
    })
      .limit(100) // limit to 100 for performance
      .select("title description category fileType fileUrl geoBounds uploadedBy createdAt updatedAt")
      .lean();

    // Enhance each dataset with additional metadata you want to expose
    const enhancedDatasets = datasets.map((d) => ({
      id: d._id,
      title: d.title,
      description: d.description || "",
      category: d.category || "other",
      fileType: d.fileType,
      fileUrl: d.fileUrl,
      geoBounds: d.geoBounds,
      uploadedByUser: d.uploadedBy?.username || "Unknown",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      centroid: d.geoBounds?.type === "Polygon" && d.geoBounds.coordinates.length
        ? turf.centroid({ type: "Feature", geometry: d.geoBounds }).geometry.coordinates
        : null,
    }));

    return res.json({
      datasets: enhancedDatasets,
      metadata: {
        center: [longitude, latitude],
        radius_km: radiusKm,
        count: enhancedDatasets.length,
      },
    });
  } catch (err) {
    logger.error("Failed to fetch area datasets", { error: err });
    return res.status(500).json({ error: "Failed to fetch datasets." });
  }
});

// PATCH update dataset by id
router.patch(
  "/:id",
  requireClerkAuth,
  requireAuth,
  updateDatasetValidationRules,
  validate,
  async (req, res) => {
    try {
      const updated = await Dataset.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      res.json(updated);
    } catch (err) {
      logger.error("Failed to update dataset", { error: err });
      res.status(500).json({ error: "Failed to update dataset." });
    }
  }
);

// DELETE dataset by id (only uploader allowed)
router.delete("/:id", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const { userId } = getAuth(req);
    if (dataset.uploadedBy.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this dataset" });
    }

    await dataset.deleteOne();
    res.json({ message: "Dataset deleted successfully." });
  } catch (err) {
    logger.error("Failed to delete dataset", { error: err });
    res.status(500).json({ error: "Failed to delete dataset." });
  }
});

// Export datasets as GeoJSON or CSV format
router.get("/export", async (req, res) => {
  const { format = "geojson", bbox } = req.query;
  const query = {};

  if (bbox) {
    try {
      const polygon = turf.bboxPolygon(JSON.parse(bbox)).geometry;
      query["geoBounds"] = { $geoWithin: { $geometry: polygon } };
    } catch (err) {
      return res.status(400).json({ error: "Invalid bbox format." });
    }
  }

  try {
    const datasets = await Dataset.find(query);

    if (format === "csv") {
      const csv = convertToCSV(datasets);
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    } else {
      res.json({
        type: "FeatureCollection",
        features: datasets.map((d) => ({
          type: "Feature",
          geometry: d.geoBounds,
          properties: {
            ...d.toObject(),
            geoBounds: undefined,
            __v: undefined,
          },
        })),
      });
    }
  } catch (err) {
    logger.error("Failed to export datasets", { error: err });
    res.status(500).json({ error: "Failed to export datasets." });
  }
});

// Secure route example (authenticated user)
router.get("/secure", requireClerkAuth, requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    let user = null;

    if (userId) {
      try {
        user = await clerkClient.users.getUser(userId);
      } catch (userError) {
        logger.error("Error fetching user info", { error: userError });
      }
    }

    const name = user?.firstName || user?.lastName || req.user?.name || "User";
    res.json({ message: `Hello, ${name}` });
  } catch (err) {
    logger.error("Secure route error", { error: err });
    res.status(500).json({ error: err.message });
  }
});

// Admin-only route
router.get("/admin-only", requireClerkAuth, requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

// Public route with optional authentication
router.get("/public", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        const name = user?.firstName || user?.lastName || "User";
        return res.json({ message: `Welcome back, ${name}` });
      } catch (userError) {
        logger.error("Error fetching user info", { error: userError });
        const name = req.user?.firstName || req.user?.name || "User";
        return res.json({ message: `Welcome back, ${name}` });
      }
    }

    res.json({ message: "Welcome, guest!" });
  } catch (err) {
    logger.error("Public route error", { error: err });
    res.status(500).json({ error: err.message });
  }
});

/*
  Future enhancement ideas:

  - Implement caching (e.g. Redis) for fetched climate data or dataset queries to reduce load and latency
  - Add Swagger/OpenAPI documentation for all routes for API usability
  - Extract route handler logic into separate controllers for better testability and maintainability
*/

export default router;
