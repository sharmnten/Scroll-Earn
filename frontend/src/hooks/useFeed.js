import { useState, useCallback, useRef } from 'react';
import { getFeed } from '../services/api';

export function useFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const loadPage = useCallback(async () => {
    if (loading || !hasMoreRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFeed(pageRef.current, 10);
      setItems((prev) => [...prev, ...data.items]);
      hasMoreRef.current = data.hasMore;
      pageRef.current += 1;
    } catch (err) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setItems([]);
    pageRef.current = 1;
    hasMoreRef.current = true;
    setError(null);
  }, []);

  return { items, loading, error, loadPage, reset, hasMore: hasMoreRef.current };
}
