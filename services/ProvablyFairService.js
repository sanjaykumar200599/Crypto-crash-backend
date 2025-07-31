//ProvablyFair Service
const crypto = require("crypto");

// Generate a random hex seed
function generateSeed() {
  return crypto.randomBytes(16).toString("hex");
}

// Hash the seed using SHA256
function generateHash(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

// Generate crash point based on hash, capped by maxMultiplier
function generateCrashPoint(seed, maxMultiplier = 100) {
  const hash = generateHash(seed);
  const h = parseInt(hash.slice(0, 13), 16); // First 52 bits
  const result = 1 + (h / Math.pow(2, 52)); // Random number > 1

  if (result >= 1) return 1.0; // Rare: force instant crash

  const crashPoint = Math.floor((maxMultiplier / (1 - result))) / 100;
  return Math.min(crashPoint, maxMultiplier);
}

// Generate seed + hash for provable fairness
function generateSeedAndHash() {
  const seed = generateSeed();
  const hash = generateHash(seed);
  return { seed, hash };
}

module.exports = {
  generateSeedAndHash,
  generateCrashPoint,
};
