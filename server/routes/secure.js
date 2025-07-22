import express from "express";
import {
  withAuthMiddleware,
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";

const router = express.Router();

router.use(withAuthMiddleware); // applies to all below

router.get("/profile", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.emailAddresses[0].emailAddress,
  });
});

router.get("/admin", requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

export default router;
