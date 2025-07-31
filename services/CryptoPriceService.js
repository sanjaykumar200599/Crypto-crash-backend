const axios = require("axios");

let cache = {};
let lastFetch = 0;
const CACHE_DURATION = 10000; // 10 seconds

async function fetchCryptoPrice(crypto = "bitcoin") {
  const now = Date.now();

  // Return cached price if not expired
  if (cache[crypto] && now - lastFetch < CACHE_DURATION) {
    return cache[crypto];
  }

  try {
    const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    const url = `${COINGECKO_API_URL}/simple/price?ids=${crypto}&vs_currencies=usd`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CryptoCrashGame/1.0 (+sanjayofficial0918@gmail.com)', 
      },
    });

    const price = response.data[crypto]?.usd;

    if (price) {
      cache[crypto] = price;
      lastFetch = now;
      return price;
    } else {
      throw new Error("Price not found in API response.");
    }
  } catch (error) {
    console.error("❌ Failed to fetch crypto price:", error.message);
    return cache[crypto] || null;
  }
}

module.exports = { fetchCryptoPrice };
