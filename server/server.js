import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import riskZoneRoutes from "./routes/riskZones.js";
import alertRoutes from "./routes/alerts.js";
import dotenv from "dotenv";
import cors from "cors";

const MONGO_URI ='mongodb://localhost:27017/'


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());
app.use("/api/risk-zones", riskZoneRoutes);
app.use("/api/alerts", alertRoutes);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));