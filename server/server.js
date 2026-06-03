require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("./utils/db");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const problemRoutes = require("./routes/problems");
const matchRoutes = require("./routes/matches");
const { seedProblems } = require("./controllers/problemController");
const socketHandler = require("./socket");

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend connection
app.use(
  cors({
    origin: "*", // Adjust in production to frontend build URI
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/matches", matchRoutes);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Code Duel Arena API is running" });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/code_duel_arena";
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully!");
    
    // Seed problems if empty
    await seedProblems();
    
    // Initialize Sockets
    socketHandler(io);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
