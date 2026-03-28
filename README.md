# ScrollEarn

A TikTok-style vertical scrolling feed app where users watch short videos and earn real in-app credits by completing rewarded video ads.

---

## Overview

ScrollEarn is a full-stack MVP consisting of:

- **Backend** — Express.js REST API with SQLite database
- **Frontend** — React web app with TikTok-style vertical swipe feed
- **Ad integration** — Unity Ads Web SDK (rewarded video)
- **Videos** — YouTube iframes (no download or rehosting)
- **Wallet** — Per-user credit balance, updated only via verified server-side callbacks

### Core product behaviour

1. Full-screen vertical swipe feed (keyboard, touch, and mouse wheel)
2. Feed is ~85% YouTube videos, ~15% "Watch Ad to Earn" cards
3. Infinite scroll
4. Rewards are only issued after the Unity Ads SDK fires its `onComplete` callback — never via timers or client-side faking

---

## Project structure

```
ScrollEarn/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── db.js                   # SQLite database (better-sqlite3)
│   ├── routes/
│   │   ├── auth.js             # POST /auth/session
│   │   ├── feed.js             # GET /feed
│   │   ├── ad.js               # POST /ad/start, /ad/complete, /ad/reward
│   │   └── wallet.js           # GET /wallet/:userId
│   ├── middleware/
│   │   └── rateLimit.js        # Rate limiting
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── Feed.js / Feed.css
│   │   │   ├── VideoCard.js / VideoCard.css
│   │   │   ├── AdCard.js / AdCard.css
│   │   │   └── WalletBar.js / WalletBar.css
│   │   ├── hooks/
│   │   │   ├── useFeed.js
│   │   │   └── useWallet.js
│   │   ├── services/
│   │   │   ├── api.js          # Backend API client
│   │   │   └── unityAds.js     # Unity Ads Web SDK integration
│   │   └── styles/
│   │       └── global.css
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Database schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('reward', 'debit')),
  description TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE ad_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
            CHECK(status IN ('pending', 'completed', 'rewarded', 'failed')),
  reward_amount REAL NOT NULL DEFAULT 0.01,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Backend API

### `POST /auth/session`

Create or restore an anonymous user session.

**Request body:**
```json
{ "userId": "optional-existing-id" }
```

**Response:**
```json
{ "userId": "uuid", "balance": 0.05, "total_earned": 0.05 }
```

---

### `GET /feed?page=1&pageSize=10`

Returns a paginated, randomised feed of videos and ad cards.

**Response:**
```json
{
  "page": 1,
  "pageSize": 10,
  "hasMore": true,
  "items": [
    {
      "type": "video",
      "id": "video-0",
      "youtubeId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&modestbranding=1"
    },
    {
      "type": "ad",
      "id": "ad-5",
      "rewardAmount": 0.01,
      "title": "Watch Ad to Earn",
      "description": "Watch a short video ad and earn $0.01 credits!"
    }
  ]
}
```

---

### `POST /ad/start`

Register the start of an ad session before showing the ad.

**Request body:**
```json
{ "userId": "uuid" }
```

**Response:**
```json
{ "sessionId": "uuid", "rewardAmount": 0.01 }
```

---

### `POST /ad/complete`

Called immediately after the Unity Ads SDK fires its `onComplete` callback. Marks the session as completed so it can be rewarded.

**Request body:**
```json
{ "userId": "uuid", "sessionId": "uuid" }
```

---

### `POST /ad/reward`

Verifies ad session completion and credits the wallet. Rate limited to 20 calls per 15 minutes per user.

**Request body:**
```json
{ "userId": "uuid", "sessionId": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "reward": 0.01,
  "balance": 0.06,
  "total_earned": 0.06,
  "transactionId": "uuid"
}
```

---

### `GET /wallet/:userId`

Returns the user's wallet balance and recent transaction history.

**Response:**
```json
{
  "userId": "uuid",
  "balance": 0.06,
  "total_earned": 0.06,
  "created_at": "2024-01-01T00:00:00",
  "transactions": [
    {
      "id": "uuid",
      "amount": 0.01,
      "type": "reward",
      "description": "Ad reward for session ...",
      "timestamp": "2024-01-01T00:01:00"
    }
  ]
}
```

---

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env       # copy env template
npm install
npm start                  # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local  # copy env template
# Edit .env.local and set REACT_APP_UNITY_GAME_ID to your Unity Ads Game ID
npm install
npm start                   # starts on http://localhost:3000
```

---

## Unity Ads setup

1. Create a project at [dashboard.unity.com](https://dashboard.unity.com).
2. Create a **Rewarded Video** ad unit (placement).
3. Copy your **Game ID** and **Placement ID** into `frontend/.env.local`:
   ```
   REACT_APP_UNITY_GAME_ID=1234567
   REACT_APP_UNITY_PLACEMENT_ID=rewardedVideo
   REACT_APP_UNITY_TEST_MODE=false   # set to false for production
   ```
4. The Unity Ads Web SDK is loaded automatically from the Unity CDN.

In development, `REACT_APP_UNITY_TEST_MODE=true` (the default) will show test ads.

---

## Security

- Wallet balance is **never** modified by the client directly.
- The backend validates that an ad session exists, belongs to the user, and has status `completed` before crediting the wallet.
- The entire credit operation is wrapped in a SQLite transaction for atomicity.
- The reward endpoint is rate-limited to 20 requests per 15 minutes per user.
- In production, you should additionally validate a **server-to-server callback token** from Unity Ads / AppLovin before calling `/ad/complete`.

---

## Production notes

- Replace SQLite with PostgreSQL or Appwrite for multi-instance deployments.
- Add HTTPS (TLS) and set `ALLOWED_ORIGIN` to your frontend domain.
- Enable Unity Ads server-side verification callbacks for stronger anti-fraud protection.
- Add authentication (e.g., Appwrite Auth) to replace anonymous sessions.