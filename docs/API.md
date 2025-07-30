# 🎮 Crypto Crash API Documentation

## 🌐 REST API Endpoints

### 1. `GET /api/players`
- **Description:** Fetch all players.
- **Response:**
```json
[
  {
    "_id": "123",
    "name": "Alice",
    "email": "alice@example.com",
    "usdBalance": 1000,
    "cryptoBalance": {
      "BTC": 0.01,
      "ETH": 0.1
    }
  }
]
