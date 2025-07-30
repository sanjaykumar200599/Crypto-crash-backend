//Contains small helper functions used across services (e.g., random crash generator, hash functions, mock tx hash, etc.):
// helpers.js

const crypto = require('crypto');

// Generate a random SHA-256 hash from input
const generateHash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Generate a mock transaction hash (simulate blockchain tx)
const generateMockTransactionHash = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Get current timestamp in ISO format
const getTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  generateHash,
  generateMockTransactionHash,
  getTimestamp,
};
