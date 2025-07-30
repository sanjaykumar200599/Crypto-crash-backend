//Player.js
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  wallet: {
    BTC: { type: Number, default: 1.0 }, // simulate some initial balance
    ETH: { type: Number, default: 1.0 }
  },
}, { timestamps: true });

module.exports = mongoose.model("Player", playerSchema);
