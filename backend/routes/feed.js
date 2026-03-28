const express = require('express');
const router = express.Router();

// Curated YouTube video IDs for the feed (short, engaging content)
const YOUTUBE_VIDEOS = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito' },
  { id: '9bZkp7q19f0', title: 'PSY - Gangnam Style' },
  { id: 'RgKAFK5djSk', title: 'Wiz Khalifa - See You Again' },
  { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You' },
  { id: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk' },
  { id: 'pRpeEdMmmQ0', title: 'Pharrell Williams - Happy' },
  { id: 'YQHsXMglC9A', title: 'Adele - Hello' },
  { id: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars' },
  { id: 'CevxZvSJLk8', title: 'Katy Perry - Roar' },
  { id: 'nfWlot6h_JM', title: 'Taylor Swift - Shake It Off' },
  { id: 'fLexgOxsZu0', title: 'Maroon 5 - Sugar' },
  { id: '60ItHLz5WEA', title: 'Alan Walker - Faded' },
  { id: 'YBHQbu5IDKg', title: 'Eminem - Rap God' },
  { id: 'y6Sxv-sUYtM', title: 'Post Malone, Swae Lee - Sunflower' },
  { id: 'SlPhMPnQ58k', title: 'Juice WRLD - Lucid Dreams' },
  { id: 'QjIwFyvBFzA', title: 'Billie Eilish - bad guy' },
  { id: 'TUVcZfQe-Kw', title: 'The Weeknd - Blinding Lights' },
  { id: '7wtfhZwyrcc', title: 'Olivia Rodrigo - drivers license' },
  { id: 'H5v3kku4y6Q', title: 'Dua Lipa - Levitating' },
];

// AD_REWARD_AMOUNT in credits (cents equivalent)
const AD_REWARD_AMOUNT = 0.01;

/**
 * Build a randomized feed page.
 * Items are mixed: ~85% videos, ~15% ad cards.
 * Ad cards are inserted every 5-10 items.
 */
function buildFeedPage(page = 1, pageSize = 10) {
  const items = [];
  let adInsertAt = Math.floor(Math.random() * 5) + 5; // first ad at position 5-9

  for (let i = 0; i < pageSize; i++) {
    const globalIndex = (page - 1) * pageSize + i;

    if (i === adInsertAt) {
      items.push({
        type: 'ad',
        id: `ad-${globalIndex}`,
        rewardAmount: AD_REWARD_AMOUNT,
        title: 'Watch Ad to Earn',
        description: `Watch a short video ad and earn $${AD_REWARD_AMOUNT.toFixed(2)} credits!`,
      });
      adInsertAt = i + Math.floor(Math.random() * 5) + 5; // next ad 5-9 items later
    } else {
      const video = YOUTUBE_VIDEOS[(globalIndex + Math.floor(Math.random() * 3)) % YOUTUBE_VIDEOS.length];
      items.push({
        type: 'video',
        id: `video-${globalIndex}`,
        youtubeId: video.id,
        title: video.title,
        embedUrl: `https://www.youtube.com/embed/${video.id}?autoplay=0&rel=0&modestbranding=1`,
      });
    }
  }

  return items;
}

// GET /feed?page=1&pageSize=10
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(5, parseInt(req.query.pageSize) || 10));

    const items = buildFeedPage(page, pageSize);

    res.json({
      page,
      pageSize,
      items,
      hasMore: true, // infinite scroll — always more
    });
  } catch (err) {
    console.error('Error in /feed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
