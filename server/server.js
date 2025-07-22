import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import datasetRoutes from "./routes/datasets.js";
import faqRoutes from "./routes/faqs.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
import riskZoneRoutes from "./routes/riskZones.js";
import messageRoutes from "./routes/messages.js";
import uploadRoute from "./routes/upload.js";
import Message from "./models/Message.js";

// Load environment variables once
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});


// Initialize bad-words filter 
let filter;
try {
  const { Filter } = await import("bad-words");
  filter = new Filter();
  console.log("✅ Bad-words filter loaded successfully");
} catch (error) {
  console.warn("⚠️ Failed to load bad-words filter:", error.message);
  // Fallback: simple profanity filter
  filter = {
    clean: (text) => {
      // Simple fallback profanity filter
      const badWords = ['spam', 'abuse', 'hate', 'damn', 'shit', 'fuck'];
      let cleanText = text;
      badWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleanText = cleanText.replace(regex, '*'.repeat(word.length));
      });
      return cleanText;
    }
  };
}

// Environment-based logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Clerk middleware: attach auth info to req.auth
app.use(clerkMiddleware());

// Routes
app.use("/api/datasets", datasetRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/admin", requireAuth(), adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/risk-zones", riskZoneRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoute);

// MongoDB connection (removed deprecated options)
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received. Shutting down...");
  await mongoose.disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Shutting down...");
  await mongoose.disconnect();
  process.exit(0);
});

// Socket.io chat
io.on("connection", (socket) => {
  console.log("📡 User connected");

  // Send online user count
  io.emit("online_users", Array.from(io.sockets.sockets.keys()));

  // Send initial messages (latest 50)
  socket.on("get_messages", async () => {
    try {
      const msgs = await Message.find({})
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();
      socket.emit("initial_messages", msgs.reverse());
    } catch (err) {
      socket.emit("error", { message: "Failed to load messages" });
    }
  });

  // Receive and broadcast messages (with support for replies)
  socket.on("send_message", async (data, ack) => {
    try {
      const cleanContent = filter.clean(data.text || "");
      const newMessage = new Message({
        sender: data.name || data.sender,
        content: cleanContent,
        avatarUrl: data.avatarUrl || "",
        tag: data.tag || "",
        imageUrl: data.imageUrl || "",
        parentId: data.parentId || null,
        timestamp: new Date(),
      });
      await newMessage.save();

      // If it's a reply, update parent message's replies array
      if (data.parentId) {
        await Message.findByIdAndUpdate(
          data.parentId,
          { $push: { replies: newMessage._id } }
        );
      }

      // Populate replies for frontend
      let populatedMsg = newMessage.toObject();
      if (data.parentId) {
        populatedMsg.replies = await Message.find({ parentId: newMessage.parentId });
      } else {
        populatedMsg.replies = [];
      }

      io.emit("receive_message", populatedMsg);
      if (ack) ack({ status: "ok" });
    } catch (error) {
      console.error("Error processing message:", error);
      if (ack) ack({ status: "error" });
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicator
  socket.on("typing", (name) => {
    socket.broadcast.emit("user_typing", name);
  });

  // Update online users on disconnect
  socket.on("disconnect", () => {
    console.log("📴 User disconnected");
    io.emit("online_users", Array.from(io.sockets.sockets.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});