import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// 🔐 Protect all message routes
router.use(requireAuth);

// 🔧 Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// 📥 GET all messages
router.get("/", getMessages);

// 📨 POST a message (with optional image upload)
router.post("/", upload.single("image"), postMessage);

export default router;
