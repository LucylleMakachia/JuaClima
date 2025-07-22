import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Dataset from "../models/Dataset.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

dotenv.config();
const router = express.Router();

// 🔐 Require auth for all upload routes
router.use(requireAuth);

// 🛡️ Rate limiter – 5 uploads/hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many uploads from this user. Please try again later.",
  keyGenerator: (req) => req.user.id, // Per-user limit
});

// 📦 File type whitelist
const allowedTypes = [".csv", ".tif", ".tiff", ".zip"]; // zip assumed to be for SHP

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Allowed: ${allowedTypes.join(", ")}`));
    }
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧠 Check if uploads are admin-only
const enforceAdminIfNeeded = (req, res, next) => {
  const adminOnly = process.env.UPLOADS_ADMIN_ONLY === "true";
  if (!adminOnly) return next();
  if (req.user.publicMetadata?.roles?.includes("admin")) return next();
  return res.status(403).json({ error: "Only admins can upload datasets at this time." });
};

// 📁 File upload + metadata save
router.post(
  "/",
  uploadLimiter,
  enforceAdminIfNeeded,
  upload.single("file"),
  async (req, res) => {
    const { title, category, description } = req.body;
    const user = req.user;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();

      const dataset = new Dataset({
        title,
        description,
        category,
        fileUrl,
        fileType,
        uploadedBy: user.username || user.id || "Unknown",
      });

      await dataset.save();

      res.status(201).json({
        message: "✅ Upload and save successful",
        dataset,
      });
    } catch (err) {
      console.error("❌ Upload error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
