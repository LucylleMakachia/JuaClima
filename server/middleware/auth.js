import clerk from "../utils/clerkAdmin.js";
import logger from "../utils/logger.js";

// --- Utility Role Checkers ---

export const hasRole = (user, role) => user?.publicMetadata?.roles?.includes(role);
export const hasAllRoles = (user, requiredRoles = []) => {
  const roles = user?.publicMetadata?.roles || [];
  return requiredRoles.every(role => roles.includes(role));
};
export const hasAnyRole = (user, allowedRoles = []) => {
  const roles = user?.publicMetadata?.roles || [];
  return allowedRoles.some(role => roles.includes(role));
};

// --- Main Middleware ---

export const withAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    // Optionally allow internal API tokens (optional feature)
    if (token === process.env.INTERNAL_API_TOKEN) {
      req.user = { id: "system", publicMetadata: { roles: ["admin"] } };
      logger.info("Authenticated internal system access.");
      return next();
    }

    const session = await clerk.sessions.verifySession(token);
    const user = await clerk.users.getUser(session.userId);

    req.user = user;
    logger.info(`Authenticated user ${user.id}`);
    next();
  } catch (err) {
    logger.warn("Auth middleware failed:", err.message);
    req.user = null;
    next(); // Still allow public routes
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.warn("Unauthorized access attempt.");
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const optionalAuth = (req, res, next) => next();

export const guestOnly = (req, res, next) => {
  if (req.user) {
    logger.warn(`Guest-only route blocked for user ${req.user.id}`);
    return res.status(403).json({ message: "Forbidden: Guests only" });
  }
  next();
};

// --- Role Enforcement Middleware ---

export const requireAdmin = (req, res, next) => {
  if (!req.user || !hasRole(req.user, "admin")) {
    logger.warn(`Forbidden: ${req.user?.id || "unknown"} lacks admin role`);
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

export const requirePremium = (req, res, next) => {
  if (!req.user || !hasRole(req.user, "premium")) {
    logger.warn(`Forbidden: ${req.user?.id || "unknown"} lacks premium role`);
    return res.status(403).json({ message: "Premium users only" });
  }
  next();
};

export const requireAnyRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !hasAnyRole(req.user, roles)) {
      logger.warn(`User ${req.user?.id || "unknown"} lacks any of roles: ${roles}`);
      return res.status(403).json({
        message: `Forbidden: Requires one of roles [${roles.join(", ")}]`,
      });
    }
    next();
  };
};

export const requireAllRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !hasAllRoles(req.user, roles)) {
      logger.warn(`User ${req.user?.id || "unknown"} lacks all required roles: ${roles}`);
      return res.status(403).json({
        message: `Forbidden: Requires all roles [${roles.join(", ")}]`,
      });
    }
    next();
  };
};
