//validation.js
//This will handle basic input validations (e.g., bet amount, valid crypto symbol)

module.exports.validateBet = (req, res, next) => {
  const { usdAmount, currency } = req.body;

  if (!usdAmount || usdAmount <= 0) {
    return res.status(400).json({ error: 'Invalid USD amount for bet.' });
  }

  if (!currency || typeof currency !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing currency.' });
  }

  next();
};

module.exports.validateCashout = (req, res, next) => {
  const { playerId } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'Missing player ID for cashout.' });
  }

  next();
};
