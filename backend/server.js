require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(generalLimiter);

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/feed', require('./routes/feed'));
app.use('/ad', require('./routes/ad'));
app.use('/wallet', require('./routes/wallet'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ScrollEarn backend running on http://localhost:${PORT}`);
});

module.exports = app;
