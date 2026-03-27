import { useState, useCallback, useRef } from 'react';
import { createSession, getWallet } from '../services/api';

const USER_ID_KEY = 'scrollearn_user_id';

export function useWallet() {
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  const init = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setLoading(true);
    try {
      const savedId = localStorage.getItem(USER_ID_KEY);
      const session = await createSession(savedId);
      localStorage.setItem(USER_ID_KEY, session.userId);
      setUserId(session.userId);
      setBalance(session.balance ?? 0);
      setTotalEarned(session.total_earned ?? 0);
    } catch (err) {
      console.error('Failed to initialize wallet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (uid) => {
    const id = uid || userId;
    if (!id) return;
    try {
      const data = await getWallet(id);
      setBalance(data.balance);
      setTotalEarned(data.total_earned);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  }, [userId]);

  const updateBalance = useCallback((newBalance, newTotalEarned) => {
    setBalance(newBalance);
    if (newTotalEarned !== undefined) setTotalEarned(newTotalEarned);
  }, []);

  return { userId, balance, totalEarned, loading, init, refresh, updateBalance };
}
