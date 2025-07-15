import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Dataset from "../models/Dataset.js";

dotenv.config();
const router = express.Router();

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

const upload = multer({ storage });


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Handle file upload (local storage, can be upgraded to Cloudinary)
router.post("/", upload.single("file"), async (req, res) => {
  const { title, category, description, userId, username } = req.body;

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  const fileType = path.extname(req.file.originalname).substring(1).toLowerCase(); // e.g., csv

  try {
    const dataset = new Dataset({
      title,
      description,
      category,
      fileUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      uploadedBy: username || userId || "Anonymous"
    });

    await dataset.save();

    res.status(201).json({
      message: "✅ Upload and save successful",
      dataset
    });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
