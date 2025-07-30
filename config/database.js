// config/database.js
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // simplified, latest mongoose defaults
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
