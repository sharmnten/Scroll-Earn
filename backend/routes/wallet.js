const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /wallet/:userId
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT id, balance, total_earned, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = db.prepare(
      'SELECT id, amount, type, description, timestamp FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50'
    ).all(userId);

    res.json({
      userId: user.id,
      balance: user.balance,
      total_earned: user.total_earned,
      created_at: user.created_at,
      transactions,
    });
  } catch (err) {
    console.error('Error in /wallet/:userId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
