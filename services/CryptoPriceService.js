const axios = require("axios");

async function fetchCryptoPrice(crypto = "bitcoin") {
  try {
    const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

    // Build URL using the base API URL and crypto id
    const url = `${COINGECKO_API_URL}/simple/price?ids=${crypto}&vs_currencies=usd`;

    const response = await axios.get(url);
    return response.data[crypto].usd;
  } catch (error) {
    console.error("Failed to fetch crypto price:", error.message);
    return null;
  }
}

module.exports = { fetchCryptoPrice };
