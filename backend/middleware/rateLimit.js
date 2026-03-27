const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the ad reward endpoint.
 * Allows a maximum of 20 reward claims per user per 15 minutes.
 * This prevents abuse while allowing normal usage.
 */
const adRewardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => {
    // Rate limit per userId if present, otherwise per IP
    return req.body?.userId || req.ip;
  },
  message: { error: 'Too many reward requests. Please wait before claiming more rewards.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { adRewardLimiter, generalLimiter };
