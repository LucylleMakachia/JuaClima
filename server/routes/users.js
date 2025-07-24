import express from "express";
const router = express.Router();

// Sample placeholder route
router.get("/", (req, res) => {
  res.send("User routes placeholder");
});

export default router;
