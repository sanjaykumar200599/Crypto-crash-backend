Frontend url: https://crypto-crash-backend.vercel.app/

Backend url:  https://crypto-crash-backend-m4w8.onrender.com/
 # 🎮 Crypto Crash Game (Backend)

Below api endpoint is created in postman.

user_id: 688b57d79a5c82fc9b343799   
name :king  
IMP : Please use this ID instead random ID  for testing purpose, use this in front end deployed link.


________________________________________________________________________________________________________________________________________________________________________________________________________
A real-time multiplayer backend for a **Crypto Crash** betting game built with **Node.js**, **Express**, **WebSocket**, and **MongoDB**. Players place bets with BTC/ETH, watch the multiplier grow, and try to cash out before the game crashes!

## 🚀 Features

- 📈 Real-time multiplier updates via WebSockets
- 🎲 Provably fair crash algorithm
- 💵 USD-to-crypto conversion using live Binance prices
- 👤 Player wallet and balance management
- 🧾 Transaction history for bets, cashouts, and losses
- 📊 MongoDB models for players, rounds, and transactions
- 🔐 Secure cashout logic that rewards only pre-crash exits

---

## 🛠️ Tech Stack

- **Node.js** with **Express**
- **MongoDB** with **Mongoose**
- **Socket.IO** for real-time communication
- **Binance API** for live crypto prices
- **Crypto module** for provably fair logic

---
## 🗂️ Project Structure

crypto-crash-backend/

├── server.js

├── .env

├── config/

├── models/

|__ public/

├── services/

├── routes/

├── middleware/

├── sockets/

├── utils/

├── public/

├── scripts/

├── docs/




## 🧪 Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/sanjaykumar200599/Crypto_crash_backend.git
cd Crypto_crash_backend
```
2. Install dependencies
```bash
npm install
 ```

3. Configure Environment
Create a .env file (if needed) or ensure the following values are set:

```env
MONGODB_URI=mongodb+srv://<your_connection_string>
PORT=3000
You can also configure crash constants in /config/constants.js:
```
4. Run the server
```bash
node server.js
```

🌐 WebSocket Events
Event	Direction	Description

place_bet	Client → Server	Submit a bet

cash_out	Client → Server	Request to cash out early

round_start	Server → Client	New round begins

multiplier_update	Server → Client	Multiplier increases

round_end	Server → Client	Round ends (crash point hit)

player_cashed_out	Server → Client	Broadcast when player exits early
