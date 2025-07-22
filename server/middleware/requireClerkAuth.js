import { clerkClient } from "@clerk/express";

export async function requireClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided or invalid format" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify session token using clerkClient
    const session = await clerkClient.sessions.verifySessionToken(token);

    // Optionally fetch user details if you want more info
    const user = await clerkClient.users.getUser(session.userId);

    req.user = {
      ...session,
      ...user,
    }; 

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
