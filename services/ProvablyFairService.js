// ProvablyFairService.js
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

  const ratio = h / Math.pow(2, 52);
  const crash = 1.0 / (1 - ratio);

  if (!isFinite(crash) || crash < 1.01) {
    return 1.01;
  }

  if (crash > maxMultiplier) {
    return maxMultiplier;
  }

  return parseFloat(crash.toFixed(2));
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
