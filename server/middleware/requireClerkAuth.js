import { clerkClient, verifyToken } from "@clerk/backend";


export async function requireClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyToken(token);

    req.user = payload; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}