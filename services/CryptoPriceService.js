const axios = require("axios");

let cache = {};
let lastFetch = 0;
const CACHE_DURATION = 10000; // 10 seconds

// Map currency codes to Binance trading pairs
const cryptoMap = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
};

async function fetchCryptoPrice(currency = "btc") {
  const symbol = cryptoMap[currency.toUpperCase()];
  if (!symbol) return null;

  const now = Date.now();

  // Return cached price if still valid
  if (cache[symbol] && now - lastFetch < CACHE_DURATION) {
    return cache[symbol];
  }

  try {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    const response = await axios.get(url);
    const price = parseFloat(response.data.price);

    if (price) {
      cache[symbol] = price;
      lastFetch = now;
      return price;
    } else {
      throw new Error("No price found in Binance response.");
    }
  } catch (err) {
    console.error("❌ Binance price fetch failed:", err.message);
    return cache[symbol] || null;
  }
}

module.exports = { fetchCryptoPrice };
