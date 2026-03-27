import React from 'react';
import './WalletBar.css';

export default function WalletBar({ balance, totalEarned }) {
  return (
    <div className="wallet-bar">
      <div className="wallet-bar__logo">🎬 ScrollEarn</div>
      <div className="wallet-bar__balance">
        <span className="wallet-bar__balance-label">Balance</span>
        <span className="wallet-bar__balance-value">${balance.toFixed(2)}</span>
      </div>
      <div className="wallet-bar__earned">
        <span className="wallet-bar__earned-label">Total Earned</span>
        <span className="wallet-bar__earned-value">${totalEarned.toFixed(2)}</span>
      </div>
    </div>
  );
}
