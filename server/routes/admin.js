import express from "express";
import clerk from "../utils/clerkAdmin.js";
import { addAdminRoleToUser } from "../utils/clerkAdmin.js";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";

const router = express.Router();

// 🔐 Protect all routes with requireAuth + requireAdmin
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/userinfo
 * Returns current admin user's info
 */
router.get("/userinfo", (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.publicMetadata?.roles || [],
  });
});

/**
 * POST /api/admin/make-admin/:userId
 * Grants "admin" role to another user
 */
router.post("/make-admin/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await addAdminRoleToUser(userId);
    res.json({ message: `User ${userId} is now an admin.` });
  } catch (err) {
    console.error("Failed to promote user:", err.message);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

/**
 * GET /api/admin/user/:userId
 * View any user's info by ID (admin-only)
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await clerk.users.getUser(req.params.userId);
    res.json({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.publicMetadata?.roles || [],
    });
  } catch (err) {
    console.error("User lookup failed:", err.message);
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
