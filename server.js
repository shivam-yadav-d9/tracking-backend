import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import trackingRoutes from "./routes/tracking.routes.js";
import { initializeSocket } from "./config/socket.js";

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available inside controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Tracking Backend Running 🚀"
    });
});

// Tracking Routes
app.use("/api/tracking", trackingRoutes);

// Start Server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});