//gameSocket.js
const { Server } = require("socket.io");
const GameEngine = require("../services/GameEngine");

let io;
let gameEngine;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // consider locking this down later
    },
  });

  gameEngine = new GameEngine(io);
  gameEngine.start(); // Starts the game loop (multiplier, crash, etc.)

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    // Player places a bet
    socket.on("place_bet", async (data) => {
      try {
        await gameEngine.placeBet(socket, data);
      } catch (err) {
        socket.emit("error", { message: err.message || "Bet failed." });
      }
    });

    // Player cashes out
    socket.on("cash_out", async (data) => {
      try {
        await gameEngine.cashOut(socket, data);
      } catch (err) {
        socket.emit("error", { message: err.message || "Cashout failed." });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
}

module.exports = { setupSocket };

