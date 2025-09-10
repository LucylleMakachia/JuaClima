import { body, query, param } from "express-validator";

export const createDatasetValidationRules = [
  body("title")
    .exists({ checkFalsy: true }).withMessage("Title is required")
    .isString().withMessage("Title must be a string")
    .trim()
    .isLength({ max: 255 }).withMessage("Title is too long"),
  
  body("fileUrl")
    .exists({ checkFalsy: true }).withMessage("File URL is required")
    .isURL({ protocols: ["http", "https"] }).withMessage("Invalid URL")
    .trim(),

  body("fileType")
    .exists({ checkFalsy: true }).withMessage("File type is required")
    .isIn(["csv", "json", "geojson", "xlsx"]).withMessage("Invalid file type"),

  body("category")
    .optional()
    .isIn(["climate", "health", "agriculture", "energy", "food", "mental health", "urban planning", "other"])
    .withMessage("Invalid category"),

  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description too long"),

  // You can add more rules for geoBounds and other fields as needed
];

// For PATCH update validation (allow partial update)
export const updateDatasetValidationRules = [
  param("id")
    .exists().withMessage("Dataset ID is required")
    .isMongoId().withMessage("Invalid dataset ID"),

  body("title").optional().isString().trim().isLength({ max: 255 }),
  body("fileUrl").optional().isURL({ protocols: ["http", "https"] }),
  body("fileType").optional().isIn(["csv", "json", "geojson", "xlsx"]),
  body("category").optional().isIn(["climate", "health", "agriculture", "energy", "food", "mental health", "urban planning", "other"]),
];
