//GameEngine.js
const GameRound = require("../models/GameRound");
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const { generateCrashPoint, generateSeedAndHash } = require("./ProvablyFairService");
const { fetchCryptoPrice } = require("./CryptoPriceService");
const { ROUND_INTERVAL_MS, GROWTH_FACTOR, MAX_CRASH_MULTIPLIER } = require("../config/constants");

class GameEngine {
  constructor(io) {
    this.io = io;
    this.bets = {}; // { playerId: { usdAmount, cryptoAmount, currency, entryPrice, cashoutMultiplier } }
    this.crashPoint = 0;
    this.multiplier = 1;
    this.running = false;
    this.currentRound = null;
  }

  async start() {
    await this.runGameLoop();
    setInterval(() => this.runGameLoop(), ROUND_INTERVAL_MS);
  }

  async runGameLoop() {
    if (this.running) return;

    this.running = true;
    this.bets = {};
    this.multiplier = 1;

    // Generate provably fair seed and crash point
    const { seed, hash } = generateSeedAndHash();
    this.crashPoint = generateCrashPoint(seed, MAX_CRASH_MULTIPLIER);

    // Create new game round with required fields
    this.currentRound = new GameRound({
      round_id: Date.now().toString(), // Using timestamp as simple round id
      seed,
      hash,
      crash_point: this.crashPoint,
      player_bets: []
    });

    await this.currentRound.save();

    this.io.emit("round_start", {
      roundId: this.currentRound.round_id,
      crashPoint: this.crashPoint.toFixed(2),
      hash
    });

    const startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.multiplier = 1 + elapsed * GROWTH_FACTOR;

      this.io.emit("multiplier_update", { multiplier: this.multiplier.toFixed(2) });

      if (this.multiplier >= this.crashPoint) {
        clearInterval(interval);

        this.io.emit("round_end", { crashPoint: this.crashPoint.toFixed(2) });

        await this.resolveBets();

        this.running = false;
      }
    }, 100);
  }

  async placeBet(socket, { playerId, usdAmount, currency }) {
    try {
      if (!usdAmount || usdAmount <= 0) {
        socket.emit("error", { message: "Invalid USD amount." });
        return;
      }

      if (!currency || !["BTC", "ETH"].includes(currency)) {
        socket.emit("error", { message: "Unsupported cryptocurrency." });
        return;
      }

      const player = await Player.findById(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found." });
        return;
      }

      const cryptoPrice = await fetchCryptoPrice(currency.toLowerCase());
      if (!cryptoPrice) {
        socket.emit("error", { message: "Could not fetch crypto price." });
        return;
      }

      const cryptoAmount = usdAmount / cryptoPrice;

      // Check player crypto wallet balance
      if (!player.wallet[currency] || player.wallet[currency] < cryptoAmount) {
        socket.emit("error", { message: `Insufficient ${currency} balance.` });
        return;
      }

      // Deduct crypto from wallet
      player.wallet[currency] -= cryptoAmount;
      await player.save();

      // Store bet info
      this.bets[playerId] = {
        usdAmount,
        cryptoAmount,
        currency,
        entryPrice: cryptoPrice,
        cashoutMultiplier: null,
      };

      // Add bet info to current round's player_bets array
      this.currentRound.player_bets.push({
        player_id: player._id,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        currency,
        multiplier: 1,
        cashed_out: false,
      });
      await this.currentRound.save();

      // Log bet transaction
      const transactionHash = `bet_${Date.now()}_${playerId}`;
      const betTransaction = new Transaction({
        player_id: player._id,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        currency,
        transaction_type: "bet",
        transaction_hash: transactionHash,
        price_at_time: cryptoPrice,
      });
      await betTransaction.save();

      socket.emit("bet_placed", {
        usdAmount,
        cryptoAmount,
        currency,
        transactionHash,
      });
    } catch (err) {
      console.error("Bet Error:", err);
      socket.emit("error", { message: "Could not place bet." });
    }
  }

  async cashOut(socket, { playerId }) {
    try {
      const bet = this.bets[playerId];
      if (!bet) {
        socket.emit("error", { message: "No active bet found." });
        return;
      }

      if (bet.cashoutMultiplier) {
        socket.emit("error", { message: "Already cashed out." });
        return;
      }

      if (this.multiplier >= this.crashPoint) {
        socket.emit("error", { message: "Game already crashed." });
        return;
      }

      const cashoutMultiplier = this.multiplier;
      const payoutCrypto = bet.cryptoAmount * cashoutMultiplier;
      const payoutUSD = payoutCrypto * bet.entryPrice;

      // Add crypto to player's wallet
      const player = await Player.findById(playerId);
      player.wallet[bet.currency] += payoutCrypto;
      await player.save();

      // Update bet cashout info
      bet.cashoutMultiplier = cashoutMultiplier;

      // Update current round player_bets cashed_out flag and multiplier
      const betInRound = this.currentRound.player_bets.find(
        (b) => b.player_id.toString() === playerId.toString()
      );
      if (betInRound) {
        betInRound.cashed_out = true;
        betInRound.multiplier = cashoutMultiplier;
        await this.currentRound.save();
      }

      // Log cashout transaction
      const transactionHash = `cashout_${Date.now()}_${playerId}`;
      const cashoutTransaction = new Transaction({
        player_id: player._id,
        usd_amount: payoutUSD,
        crypto_amount: payoutCrypto,
        currency: bet.currency,
        transaction_type: "cashout",
        transaction_hash: transactionHash,
        price_at_time: bet.entryPrice,
      });
      await cashoutTransaction.save();

      socket.emit("cashed_out", {
        payoutUSD: payoutUSD.toFixed(2),
        payoutCrypto: payoutCrypto.toFixed(8),
        cashoutMultiplier: cashoutMultiplier.toFixed(2),
        transactionHash,
      });

      // Broadcast cashout event to all players
      this.io.emit("player_cashed_out", {
        playerId,
        payoutUSD: payoutUSD.toFixed(2),
        payoutCrypto: payoutCrypto.toFixed(8),
        cashoutMultiplier: cashoutMultiplier.toFixed(2),
      });
    } catch (err) {
      console.error("Cashout Error:", err);
      socket.emit("error", { message: "Could not process cashout." });
    }
  }

  async resolveBets() {
    try {
      // For players who didn't cash out, no payout (they lose)
      // Save transactions for all bets to DB

      const promises = [];

      for (const [playerId, bet] of Object.entries(this.bets)) {
        const player = await Player.findById(playerId);
        if (!player) continue;

        const won = bet.cashoutMultiplier !== null;
        const payoutCrypto = won ? bet.cryptoAmount * bet.cashoutMultiplier : 0;

        // Find matching bet record in currentRound to update multiplier and cashed_out flag if missed
        const betRecord = this.currentRound.player_bets.find(
          (b) => b.player_id.toString() === playerId.toString()
        );
        if (betRecord) {
          betRecord.multiplier = bet.cashoutMultiplier || 0;
          betRecord.cashed_out = won;
        }

        // Create transaction record for losing bets (no payout)
        if (!won) {
          const transactionHash = `loss_${Date.now()}_${playerId}`;
          const lossTransaction = new Transaction({
            player_id: player._id,
            usd_amount: bet.usdAmount,
            crypto_amount: bet.cryptoAmount,
            currency: bet.currency,
            transaction_type: "bet",
            transaction_hash: transactionHash,
            price_at_time: bet.entryPrice,
          });
          promises.push(lossTransaction.save());
        }
      }

      await Promise.all(promises);
      await this.currentRound.save();
    } catch (err) {
      console.error("Resolve Bets Error:", err);
    }
  }
}

module.exports = GameEngine;
