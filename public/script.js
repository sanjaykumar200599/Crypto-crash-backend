// ✅ Replace with your actual Render backend URL
const BACKEND_URL = "https://crypto-crash-backend-m4w8.onrender.com/";

// Socket.io connection to backend (for WebSocket)
const socket = io(BACKEND_URL);

const multiplierEl = document.getElementById("multiplier");
const crashPointEl = document.getElementById("crash-point");
const walletCryptoEl = document.getElementById("wallet-balance");
const walletUsdEl = document.getElementById("wallet-usd");
const logEl = document.getElementById("log");

const betBtn = document.getElementById("bet-btn");
const cashoutBtn = document.getElementById("cashout-btn");
const usdInput = document.getElementById("usd-amount");
const currencySelect = document.getElementById("currency");

let isBetPlaced = false;

function log(message) {
  const p = document.createElement("p");
  p.textContent = message;
  logEl.prepend(p);
}

// 🔁 Fetch wallet
async function fetchWallet() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/player/wallet`);
    const data = await res.json();
    walletCryptoEl.textContent = `${data.balance.toFixed(6)} ${data.currency}`;
    walletUsdEl.textContent = `$${data.usdEquivalent.toFixed(2)}`;
  } catch (err) {
    console.error("Wallet fetch error:", err);
    log("❌ Failed to fetch wallet");
  }
}

fetchWallet();

// 🎯 Place bet
betBtn.onclick = async () => {
  const usd = parseFloat(usdInput.value);
  const currency = currencySelect.value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/game/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usd, currency }),
    });

    const data = await res.json();

    if (res.ok) {
      log(`✅ Bet placed: $${usd} (${currency})`);
      isBetPlaced = true;
      cashoutBtn.disabled = false;
      fetchWallet();
    } else {
      alert(data.error || "Failed to place bet");
    }
  } catch (err) {
    console.error("Bet error:", err);
    alert("Error placing bet");
  }
};

// 💸 Cashout
cashoutBtn.onclick = () => {
  socket.emit("cashout");
  log("💸 Cashout requested!");
  cashoutBtn.disabled = true;
};

// 🔁 Listen for events
socket.on("multiplier_update", (data) => {
  multiplierEl.textContent = data.multiplier.toFixed(2) + "x";
});

socket.on("round_crash", (data) => {
  crashPointEl.textContent = data.crashPoint.toFixed(2) + "x";
  if (isBetPlaced) {
    isBetPlaced = false;
    fetchWallet();
  }
});

socket.on("player_cashout", (data) => {
  log(`💵 Player ${data.playerId} cashed out ${data.cryptoAmount.toFixed(6)} ${data.currency} (~$${data.usdAmount.toFixed(2)})`);
});
