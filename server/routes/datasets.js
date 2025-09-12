import express from "express";
import {
  createDataset,
  importClimate,
  getAllDatasets,
  getDatasets,
  getAreaDatasets,
  updateDataset,
  deleteDataset,
} from "../controllers/datasetController.js";

import { requireClerkAuth } from "../middleware/requireClerkAuth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

import { body, param, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import winston from "winston";

// Winston logger setup (basic)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Rate limiter for importing climate data
const importClimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "Too many import requests from this IP, please try again later.",
});

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

// Validation rules (you can keep your existing ones)
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
];

// Update validation rules etc. can be imported or rewritten here...

const updateDatasetValidationRules = [
  param("id")
    .exists()
    .withMessage("Dataset ID is required")
    .isMongoId()
    .withMessage("Invalid dataset ID"),
];

// Routes using imported controller functions

const router = express.Router();

router.post(
  "/",
  requireClerkAuth,
  requireAuth,
  createDatasetValidationRules,
  validate,
  (req, res) => createDataset(req, res)
);

router.post(
  "/import-climate",
  importClimateLimiter,
  requireClerkAuth,
  requireAuth,
  // Include validation middleware for lat, lon, dates, etc.
  validate,
  (req, res) => importClimate(req, res)
);

router.get("/", (req, res) => getDatasets(req, res));

router.get("/all", (req, res) => getAllDatasets(req, res));

router.get("/area", (req, res) => getAreaDatasets(req, res));

router.patch(
  "/:id",
  requireClerkAuth,
  requireAuth,
  updateDatasetValidationRules,
  validate,
  (req, res) => updateDataset(req, res)
);

router.delete(
  "/:id",
  requireClerkAuth,
  requireAuth,
  (req, res) => deleteDataset(req, res)
);

// Example admin protected route - add other routes as needed
router.get("/admin-only", requireClerkAuth, requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

export default router;
