import clerk from "../utils/clerkAdmin.js";
import logger from "../utils/logger.js"; // Winston logger

// --- Utility Functions ---

/**
 * Check if user has a specific role
 */
export const hasRole = (user, role) => {
  return user?.publicMetadata?.roles?.includes(role);
};

/**
 * Check if user has all specified roles
 */
export const hasAllRoles = (user, requiredRoles = []) => {
  const userRoles = user?.publicMetadata?.roles || [];
  return requiredRoles.every(role => userRoles.includes(role));
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user, allowedRoles = []) => {
  const userRoles = user?.publicMetadata?.roles || [];
  return allowedRoles.some(role => userRoles.includes(role));
};

// --- Middleware ---

export const withAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const session = await clerk.sessions.verifySession(token);
    const user = await clerk.users.getUser(session.userId);

    req.user = user;
    logger.info(`Authenticated user ${user.id}`);
    next();
  } catch (err) {
    logger.warn("withAuthMiddleware failed:", err.message);
    req.user = null;
    next();
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.warn("Unauthorized access attempt");
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const optionalAuth = (req, res, next) => {
  next();
};

export const requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || !hasRole(user, "admin")) {
    logger.warn(
      `Forbidden: User ${user?.id || "unknown"} attempted admin access without role`
    );
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

export const requirePremium = (req, res, next) => {
  const user = req.user;
  if (!user || !hasRole(user, "premium")) {
    logger.warn(
      `Forbidden: User ${user?.id || "unknown"} attempted premium access without role`
    );
    return res.status(403).json({ message: "Forbidden: Premium users only" });
  }
  next();
};

export const requireAnyRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !hasAnyRole(user, allowedRoles)) {
      logger.warn(
        `Forbidden: User ${user?.id || "unknown"} lacks any of roles: ${allowedRoles.join(", ")}`
      );
      return res.status(403).json({
        message: `Forbidden: Requires one of roles [${allowedRoles.join(", ")}]`,
      });
    }
    next();
  };
};

export const requireAllRoles = (requiredRoles = []) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !hasAllRoles(user, requiredRoles)) {
      logger.warn(
        `Forbidden: User ${user?.id || "unknown"} lacks all required roles: ${requiredRoles.join(", ")}`
      );
      return res.status(403).json({
        message: `Forbidden: Requires all roles [${requiredRoles.join(", ")}]`,
      });
    }
    next();
  };
};

export const guestOnly = (req, res, next) => {
  if (req.user) {
    logger.warn(`Guest-only route blocked for user ${req.user.id}`);
    return res.status(403).json({ message: "Forbidden: Guests only" });
  }
  next();
};
