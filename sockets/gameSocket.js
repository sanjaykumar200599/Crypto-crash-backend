//gameSocket.js
const { Server } = require("socket.io");
const GameEngine = require("../services/GameEngine");

let io;
let gameEngine;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  gameEngine = new GameEngine(io);
  gameEngine.start(); // Starts game loop

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    // Player places a bet
    socket.on("place_bet", async (data) => {
      await gameEngine.placeBet(socket, data);
    });

    // Player cashes out
    socket.on("cash_out", async (data) => {
      await gameEngine.cashOut(socket, data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
}

module.exports = { setupSocket };
