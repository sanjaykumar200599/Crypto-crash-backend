//GameRound.js
const mongoose = require("mongoose");

const gameRoundSchema = new mongoose.Schema({
  round_id: { type: String, required: true, unique: true },
  crash_point: { type: Number, required: true },
  seed: { type: String, required: true },
  hash: { type: String, required: true },
  player_bets: [{
    player_id: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    usd_amount: Number,
    crypto_amount: Number,
    currency: String,
    multiplier: Number,
    cashed_out: Boolean
  }],
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date }
});

module.exports = mongoose.model("GameRound", gameRoundSchema);
