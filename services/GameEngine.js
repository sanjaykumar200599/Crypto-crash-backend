const GameRound = require("../models/GameRound");
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const { generateCrashPoint, generateSeedAndHash } = require("./ProvablyFairService");
const { fetchCryptoPrice } = require("./CryptoPriceService");
const { ROUND_INTERVAL_MS, GROWTH_FACTOR, MAX_CRASH_MULTIPLIER } = require("../config/constants");

class GameEngine {
  constructor(io) {
    this.io = io;
    this.bets = {};
    this.crashPoint = 0;
    this.multiplier = 1;
    this.running = false;
    this.currentRound = null;
    this.multiplierInterval = null;
  }

  async start() {
    setInterval(() => this.checkAndStartGame(), ROUND_INTERVAL_MS);
  }

  async checkAndStartGame() {
    if (this.running) return;

    const hasBets = Object.keys(this.bets).length > 0;
    if (!hasBets) return;

    await this.runGameLoop();
  }

  async runGameLoop() {
    this.running = true;
    this.multiplier = 1;

    const { seed, hash } = generateSeedAndHash();
    this.crashPoint = generateCrashPoint(seed, MAX_CRASH_MULTIPLIER);

    this.currentRound = new GameRound({
      round_id: Date.now().toString(),
      seed,
      hash,
      crash_point: this.crashPoint,
      player_bets: [],
    });
    await this.currentRound.save();

    this.io.emit("round_start", {
      roundId: this.currentRound.round_id,
      crashHash: hash,
    });
    console.log(`🚀 Round Started | Crash at: ${this.crashPoint.toFixed(2)}x`);

    const startTime = Date.now();

    this.multiplierInterval= setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.multiplier = 1 + elapsed * GROWTH_FACTOR;

      this.io.emit("multiplier_update", {
        multiplier: this.multiplier.toFixed(2),
      });

      if (this.multiplier >= this.crashPoint) {
        clearInterval(this.multiplierInterval);
        this.multiplierInterval = null;


        this.io.emit("round_end", {
          crashPoint: this.crashPoint.toFixed(2),
        });
        console.log(`💥 Game crashed at ${this.crashPoint.toFixed(2)}x`);

        await this.resolveBets();
        this.bets = {}; // ✅ Reset bets only after round ends
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
        socket.emit("error", { message: "Unsupported currency." });
        return;
      }

      const player = await Player.findById(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found." });
        return;
      }

      const cryptoPrice = await fetchCryptoPrice(currency.toLowerCase());
      if (!cryptoPrice) {
        socket.emit("error", { message: "Failed to fetch crypto price." });
        return;
      }

      const cryptoAmount = usdAmount / cryptoPrice;
      if (!player.wallet[currency] || player.wallet[currency] < cryptoAmount) {
        socket.emit("error", { message: `Insufficient ${currency} balance.` });
        return;
      }

      player.wallet[currency] -= cryptoAmount;
      await player.save();

      this.bets[playerId] = {
        usdAmount,
        cryptoAmount,
        currency,
        entryPrice: cryptoPrice,
        cashoutMultiplier: null,
      };

      this.currentRound.player_bets.push({
        player_id: player._id,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        currency,
        multiplier: 1,
        cashed_out: false,
      });
      await this.currentRound.save();

      const transactionHash = `bet_${Date.now()}_${playerId}`;
      const betTx = new Transaction({
        player_id: player._id,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        currency,
        transaction_type: "bet",
        transaction_hash: transactionHash,
        price_at_time: cryptoPrice,
      });
      await betTx.save();

      socket.emit("bet_placed", {
        usdAmount,
        cryptoAmount,
        currency,
        transactionHash,
      });

      console.log(`🟢 ${player.username || player._id} placed $${usdAmount} in ${currency}`);
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

    if (bet.cashoutMultiplier !== null) {
      socket.emit("error", { message: "Already cashed out." });
      return;
    }

    if (this.multiplier >= this.crashPoint) {
      socket.emit("error", { message: "Game already crashed." });
      return;
    }

    const player = await Player.findById(playerId);
    if (!player) {
      socket.emit("error", { message: "Player not found." });
      return;
    }

    const cashoutMultiplier = this.multiplier;
    const payoutCrypto = bet.cryptoAmount * cashoutMultiplier;
    const payoutUSD = payoutCrypto * bet.entryPrice;

    player.wallet[bet.currency] += payoutCrypto;
    await player.save();

    bet.cashoutMultiplier = cashoutMultiplier;

    const betInRound = this.currentRound.player_bets.find(
      (b) => b.player_id.toString() === playerId.toString()
    );
    if (betInRound) {
      betInRound.cashed_out = true;
      betInRound.multiplier = cashoutMultiplier;
      await this.currentRound.save();
    }

    const transactionHash = `cashout_${Date.now()}_${playerId}`;
    const tx = new Transaction({
      player_id: player._id,
      usd_amount: payoutUSD,
      crypto_amount: payoutCrypto,
      currency: bet.currency,
      transaction_type: "cashout",
      transaction_hash: transactionHash,
      price_at_time: bet.entryPrice,
    });
    await tx.save();

    socket.emit("cashed_out", {
      payoutUSD: payoutUSD.toFixed(2),
      payoutCrypto: payoutCrypto.toFixed(8),
      cashoutMultiplier: cashoutMultiplier.toFixed(2),
      transactionHash,
    });

    this.io.emit("player_cashed_out", {
      playerId,
      payoutUSD: payoutUSD.toFixed(2),
      payoutCrypto: payoutCrypto.toFixed(8),
      cashoutMultiplier: cashoutMultiplier.toFixed(2),
    });

    console.log(`💰 ${player.username || player._id} cashed out at ${cashoutMultiplier.toFixed(2)}x`);

    // 💥 End round immediately on first successful cashout
    if (this.multiplierInterval) {
      clearInterval(this.multiplierInterval);
      this.multiplierInterval = null;

      this.io.emit("round_end", {
        crashPoint: cashoutMultiplier.toFixed(2),
        endedEarly: true,
      });

      await this.resolveBets();
      this.bets = {};
      this.running = false;
    }
  } catch (err) {
    console.error("Cashout Error:", err);
    socket.emit("error", { message: "Could not process cashout." });
  }
}


  async resolveBets() {
    try {
      const promises = [];

      for (const [playerId, bet] of Object.entries(this.bets)) {
        const player = await Player.findById(playerId);
        if (!player) continue;

        const won = bet.cashoutMultiplier !== null;
        const payoutCrypto = won ? bet.cryptoAmount * bet.cashoutMultiplier : 0;

        const betRecord = this.currentRound.player_bets.find(
          (b) => b.player_id.toString() === playerId.toString()
        );
        if (betRecord) {
          betRecord.multiplier = bet.cashoutMultiplier || 0;
          betRecord.cashed_out = won;
        }

        if (!won) {
          const transactionHash = `loss_${Date.now()}_${playerId}`;
          const tx = new Transaction({
            player_id: player._id,
            usd_amount: bet.usdAmount,
            crypto_amount: bet.cryptoAmount,
            currency: bet.currency,
            transaction_type: "loss",
            transaction_hash: transactionHash,
            price_at_time: bet.entryPrice,
          });
          promises.push(tx.save());
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
