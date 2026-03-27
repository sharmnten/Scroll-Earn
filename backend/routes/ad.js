const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { adRewardLimiter } = require('../middleware/rateLimit');

const REWARD_AMOUNT = 0.01; // credits per completed ad

// POST /ad/start — log ad session start
router.post('/start', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionId = uuidv4();
    db.prepare(
      'INSERT INTO ad_sessions (id, user_id, status, reward_amount) VALUES (?, ?, ?, ?)'
    ).run(sessionId, userId, 'pending', REWARD_AMOUNT);

    res.status(201).json({ sessionId, rewardAmount: REWARD_AMOUNT });
  } catch (err) {
    console.error('Error in /ad/start:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ad/reward — verify ad completion and credit wallet
// This endpoint is called after the Unity Ads / AppLovin SDK emits the "ad completed" callback.
// In production, you would also validate a server-side callback token from the ad network.
router.post('/reward', adRewardLimiter, (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    // Verify user exists
    const user = db.prepare('SELECT id, balance, total_earned FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify ad session exists, belongs to user, and is in 'completed' status
    const session = db.prepare(
      'SELECT * FROM ad_sessions WHERE id = ? AND user_id = ? AND status = ?'
    ).get(sessionId, userId, 'completed');

    if (!session) {
      return res.status(400).json({
        error: 'Invalid or already processed ad session. Ad must be completed before claiming reward.',
      });
    }

    const rewardAmount = session.reward_amount;
    const txId = uuidv4();

    // Atomic transaction: update ad session, credit user wallet, record transaction
    const creditWallet = db.transaction(() => {
      db.prepare(
        "UPDATE ad_sessions SET status = 'rewarded', completed_at = datetime('now') WHERE id = ?"
      ).run(sessionId);

      db.prepare(
        'UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?'
      ).run(rewardAmount, rewardAmount, userId);

      db.prepare(
        'INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)'
      ).run(txId, userId, rewardAmount, 'reward', `Ad reward for session ${sessionId}`);
    });

    creditWallet();

    const updatedUser = db.prepare('SELECT balance, total_earned FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      reward: rewardAmount,
      balance: updatedUser.balance,
      total_earned: updatedUser.total_earned,
      transactionId: txId,
    });
  } catch (err) {
    console.error('Error in /ad/reward:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ad/complete — called by client after SDK fires "ad completed" callback
// Marks the ad session as completed (ready to be rewarded)
router.post('/complete', (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    const session = db.prepare(
      'SELECT * FROM ad_sessions WHERE id = ? AND user_id = ? AND status = ?'
    ).get(sessionId, userId, 'pending');

    if (!session) {
      return res.status(400).json({ error: 'Ad session not found or already processed' });
    }

    db.prepare("UPDATE ad_sessions SET status = 'completed' WHERE id = ?").run(sessionId);

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error in /ad/complete:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
