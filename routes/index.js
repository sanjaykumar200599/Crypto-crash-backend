//index.js
const express = require("express");
const router = express.Router();

const playerRoutes = require("./players");
const gameRoutes = require("./game");

router.use("/api/players", playerRoutes);
router.use("/api/game", gameRoutes);

module.exports = router;
