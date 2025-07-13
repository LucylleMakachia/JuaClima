import express from "express";
import { getZones, createRiskZone } from "../controllers/riskZoneController.js";

const router = express.Router();

router.get("/", getZones);
router.post("/", createRiskZone); 

export default router;
