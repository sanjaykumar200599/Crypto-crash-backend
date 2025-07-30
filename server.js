//server.js
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { setupSocket } = require("./sockets/gameSocket");
require("dotenv").config();

const app = express();
const server = http.createServer(app); // Required for WebSocket to work

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI ,{
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverSelectionTimeoutMS: 10000})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/players", require("./routes/players"));
app.use("/api/game", require("./routes/game"));

// Socket.io setup
setupSocket(server); // ✅ Fixed call

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


