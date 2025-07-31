//seedDatabase.js
require('dotenv').config();
const connectDB = require('../config/database');
const Player = require('../models/Player');

async function seedPlayers() {
  try {
    await connectDB();  // Connect to DB

    await Player.deleteMany(); // Clear existing data

    const players = [
      {
        username: 'Alice',
        wallet: {
          BTC: 0.01,
          ETH: 0.1,
        },
      },
      {
        username: 'Bob',
        wallet: {
          BTC: 0.015,
          ETH: 0.2,
        },
      },
    ];

    await Player.insertMany(players);
    console.log('✅ Sample players seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding players:', error);
    process.exit(1);
  }
}

seedPlayers();
