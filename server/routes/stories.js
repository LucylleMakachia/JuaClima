import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Story from "../models/story.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST new story
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "juaclima/stories",
      });
      imageUrl = result.secure_url;
    }

    const story = new Story({
      name: req.body.name,
      email: req.body.email,
      story: req.body.story,
      image: imageUrl,
      status: "pending", // moderation needed
    });

    await story.save();
    res.status(201).json({ message: "Story submitted and awaiting review." });
  } catch (error) {
    console.error("Error submitting story:", error);
    res.status(500).json({ error: "Failed to submit story" });
  }
});

export default router;
