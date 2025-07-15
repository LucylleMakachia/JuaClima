import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Filter from "bad-words";
import datasetRoutes from "./routes/datasets.js";

// Routes & Models
import riskZoneRoutes from "./routes/riskZones.js";
import messageRoutes from "./routes/messages.js";
import uploadRoute from "./routes/upload.js";
import Message from "./models/Message.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ⚠️ Update for production deployment
    methods: ["GET", "POST"],
  },
});

const filter = new Filter();
let onlineUsers = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/risk-zones", riskZoneRoutes);
app.use("/api/datasets", datasetRoutes);

// DB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Socket.io
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Add to online users
  socket.on("register_user", (name) => {
    if (name) {
      onlineUsers.set(socket.id, name);
      io.emit("online_users", Array.from(onlineUsers.values()));
    }
  });

  socket.on("typing", (name) => {
    if (name) {
      socket.broadcast.emit("user_typing", name);
    }
  });

  socket.on("send_message", async (data, callback) => {
    // Basic validation
    if (!data.name || (!data.text && !data.imageUrl)) {
      return callback?.({ status: "error", message: "Missing fields" });
    }

    if (data.text && data.text.length > 500) {
      return callback?.({ status: "error", message: "Message too long" });
    }

    if (typeof data.name !== "string" || data.name.length < 2 || data.name.length > 50) {
      return callback?.({ status: "error", message: "Invalid name" });
    }

    const allowedTags = ["alert", "help", "discussion", ""];
    if (data.tag && !allowedTags.includes(data.tag)) {
      return callback?.({ status: "error", message: "Invalid tag" });
    }

    if (data.emoji && typeof data.emoji !== "string") {
      return callback?.({ status: "error", message: "Invalid emoji" });
    }

    if (data.location) {
      const { lat, lng } = data.location;
      const isValidCoord =
        typeof lat === "number" && typeof lng === "number" &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;
      if (!isValidCoord) {
        return callback?.({ status: "error", message: "Invalid coordinates" });
      }
    }

    // Sanitize
    if (data.text) {
      data.text = filter.clean(data.text);
    }

    try {
      const saved = await Message.create(data);
      io.emit("receive_message", saved);
      callback?.({ status: "ok", message: "Message delivered" });
    } catch (err) {
      console.error("❌ Save failed:", err.message);
      callback?.({ status: "error", message: "Server error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
