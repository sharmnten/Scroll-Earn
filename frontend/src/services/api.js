const API_BASE = process.env.REACT_APP_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function createSession(userId = null) {
  return request('/auth/session', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function getFeed(page = 1, pageSize = 10) {
  return request(`/feed?page=${page}&pageSize=${pageSize}`);
}

export function startAdSession(userId) {
  return request('/ad/start', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function completeAdSession(userId, sessionId) {
  return request('/ad/complete', {
    method: 'POST',
    body: JSON.stringify({ userId, sessionId }),
  });
}

export function claimAdReward(userId, sessionId) {
  return request('/ad/reward', {
    method: 'POST',
    body: JSON.stringify({ userId, sessionId }),
  });
}

export function getWallet(userId) {
  return request(`/wallet/${userId}`);
}
