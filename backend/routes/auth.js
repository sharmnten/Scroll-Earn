const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// POST /auth/session — create or return anonymous user session
router.post('/session', (req, res) => {
  try {
    const { userId } = req.body;

    if (userId) {
      // Return existing user
      const user = db.prepare('SELECT id, balance, total_earned, created_at FROM users WHERE id = ?').get(userId);
      if (user) {
        return res.json({ userId: user.id, balance: user.balance, total_earned: user.total_earned });
      }
    }

    // Create new anonymous user
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, balance, total_earned) VALUES (?, 0, 0)').run(id);

    res.status(201).json({ userId: id, balance: 0, total_earned: 0 });
  } catch (err) {
    console.error('Error in /auth/session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
