import express from "express";
import { getMessages, postMessage, saveMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/", getMessages);
router.post("/", postMessage);
router.post("/", saveMessage)

export default router;
