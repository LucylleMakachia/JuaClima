import express from "express";
import {
  getMessages,
  postMessage,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// 🔐 Protect all message routes (must be logged in)
router.use(requireAuth);

router.get("/", getMessages);
router.post("/", postMessage);

export default router;
