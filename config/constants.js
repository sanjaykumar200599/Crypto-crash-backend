//database connection 
module.exports = {
  ROUND_INTERVAL_MS: 10000,          // New round every 10 seconds
  MULTIPLIER_UPDATE_INTERVAL: 100,   // Multiplier updates every 100ms
  GROWTH_FACTOR: 0.002,              // Exponential growth factor
  MAX_CRASH_MULTIPLIER: 120,         // Max possible crash multiplier
  SUPPORTED_CRYPTOS: ["BTC", "ETH"],
  PRICE_CACHE_TTL: 10000             // Cache crypto prices for 10s
};
