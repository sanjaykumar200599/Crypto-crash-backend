//players.js
const express = require("express");
const router = express.Router();
const Player = require("../models/Player");



// GET all players
router.get("/", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET a single player by ID
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new player
router.post("/", async (req, res) => {
  try {
    const { username } = req.body;
    const player = new Player({ username });
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE a player by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPlayer)
      return res.status(404).json({ message: "Player not found" });
    res.json(updatedPlayer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a player by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedPlayer = await Player.findByIdAndDelete(req.params.id);
    if (!deletedPlayer)
      return res.status(404).json({ message: "Player not found" });
    res.json({ message: "Player deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
