const crypto = require("crypto");

// Generate a random seed string (hex)
function generateSeed() {
  return crypto.randomBytes(16).toString("hex");
}

// Generate SHA256 hash of the seed
function generateHash(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

// Generate crash point deterministically from seed, capped at maxMultiplier
function generateCrashPoint(seed, maxMultiplier = 100) {
  // Convert seed hash to a number between 0 and 1
  const hash = generateHash(seed);
  const h = parseInt(hash.slice(0, 13), 16);
  const result = 1 + (h / Math.pow(2, 52));

  // The formula below is inspired by real provably fair crash games:
  // crashPoint = Math.floor((maxMultiplier / (1 - result))) / 100;
  const crashPoint = Math.floor((maxMultiplier / (1 - result))) / 100;

  // If result >= 1 (very unlikely), return 1 (instant crash)
  if (result >= 1) return 1.0;

  return Math.min(crashPoint, maxMultiplier);
}

// Helper to generate seed and hash together
function generateSeedAndHash() {
  const seed = generateSeed();
  const hash = generateHash(seed);
  return { seed, hash };
}

module.exports = {
  generateSeedAndHash,
  generateCrashPoint,
};
