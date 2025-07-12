import express from "express";
import { getZones, addZone } from "../controllers/riskZoneController.js";

const router = express.Router();

router.get("/", getZones);
router.post("/", addZone);

export default router;
