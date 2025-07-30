//game.js
const express = require("express");
const router = express.Router();
const GameRound = require("../models/GameRound");

// Get latest game round (for testing or analytics)
router.get("/latest", async (req, res) => {
  try {
    const round = await GameRound.findOne().sort({ started_at: -1 }).limit(1);
    if (!round) return res.status(404).json({ error: "No game round found" });
    res.json(round);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Fetch all game history
router.get("/history", async (req, res) => {
  try {
    const rounds = await GameRound.find().sort({ started_at: -1 }).limit(20);
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
