import React, { useEffect, useRef } from 'react';
import WalletBar from './components/WalletBar';
import Feed from './components/Feed';
import { useWallet } from './hooks/useWallet';
import { useFeed } from './hooks/useFeed';
import { initUnityAds } from './services/unityAds';
import './styles/global.css';

export default function App() {
  const { userId, balance, totalEarned, loading: walletLoading, init: initWallet, updateBalance } = useWallet();
  const { items, loading: feedLoading, loadPage } = useFeed();
  const loadPageRef = useRef(loadPage);

  // Initialize wallet session and Unity Ads on mount
  useEffect(() => {
    initWallet();
    initUnityAds().catch(() => {
      // SDK init failure is non-fatal — ad cards will still render
      // but will show an error when tapped until SDK is available
    });
  }, [initWallet]);

  // Load initial feed once userId is available
  useEffect(() => {
    if (userId) {
      loadPageRef.current();
    }
  }, [userId]);

  const handleRewardEarned = (newBalance, newTotalEarned) => {
    updateBalance(newBalance, newTotalEarned);
  };

  if (walletLoading && items.length === 0) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <span>Loading ScrollEarn…</span>
      </div>
    );
  }

  return (
    <div className="app">
      <WalletBar balance={balance} totalEarned={totalEarned} />
      <Feed
        items={items}
        loading={feedLoading}
        onLoadMore={loadPage}
        userId={userId}
        onRewardEarned={handleRewardEarned}
      />
    </div>
  );
}
