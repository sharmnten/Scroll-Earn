import React, { useState, useCallback } from 'react';
import { startAdSession, completeAdSession, claimAdReward } from '../services/api';
import { showRewardedAd } from '../services/unityAds';
import './AdCard.css';

const AD_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  CLAIMING: 'claiming',
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped',
};

export default function AdCard({ item, userId, onRewardEarned }) {
  const [state, setState] = useState(AD_STATES.IDLE);
  const [message, setMessage] = useState('');

  const handleWatchAd = useCallback(async () => {
    if (!userId) {
      setMessage('Please wait while we initialize your session…');
      return;
    }

    setState(AD_STATES.LOADING);
    setMessage('');

    let sessionId = null;

    try {
      // 1. Register ad session on backend
      const session = await startAdSession(userId);
      sessionId = session.sessionId;

      // 2. Show the rewarded ad via Unity Ads SDK.
      // In development/test mode the SDK will show a test ad.
      // The reward is ONLY credited after the SDK fires onComplete.
      setState(AD_STATES.PLAYING);

      await new Promise((resolve, reject) => {
        showRewardedAd({
          onStart: () => {
            console.log('Ad started for session:', sessionId);
          },
          onComplete: () => resolve('completed'),
          onSkip: () => reject(new Error('skipped')),
          onError: (err) => reject(new Error(err || 'Ad failed')),
        });
      });

      // 3. SDK fired onComplete — mark session as completed on backend
      setState(AD_STATES.CLAIMING);
      await completeAdSession(userId, sessionId);

      // 4. Claim the reward — backend verifies and credits wallet
      const result = await claimAdReward(userId, sessionId);

      setState(AD_STATES.SUCCESS);
      setMessage(`+$${result.reward.toFixed(2)} added to your wallet!`);

      // Notify parent to refresh balance
      onRewardEarned?.(result.balance, result.total_earned);

    } catch (err) {
      if (err.message === 'skipped') {
        setState(AD_STATES.SKIPPED);
        setMessage('You skipped the ad. No reward earned.');
      } else {
        setState(AD_STATES.ERROR);
        setMessage(err.message || 'Something went wrong. Please try again.');
        console.error('Ad reward flow error:', err);
      }
    }
  }, [userId, onRewardEarned]);

  const handleRetry = useCallback(() => {
    setState(AD_STATES.IDLE);
    setMessage('');
  }, []);

  return (
    <div className="ad-card">
      <div className="ad-card__bg" />
      <div className="ad-card__content">
        <div className="ad-card__icon">🎁</div>
        <h2 className="ad-card__title">Watch Ad to Earn</h2>
        <p className="ad-card__subtitle">
          Watch a short video ad and earn{' '}
          <strong className="ad-card__amount">${item.rewardAmount.toFixed(2)}</strong>{' '}
          credits instantly!
        </p>

        {state === AD_STATES.IDLE && (
          <button
            className="ad-card__btn"
            onClick={handleWatchAd}
            disabled={!userId}
          >
            ▶ Watch Ad &amp; Earn
          </button>
        )}

        {state === AD_STATES.LOADING && (
          <div className="ad-card__status loading">
            <span className="ad-card__spinner" />
            Loading ad…
          </div>
        )}

        {state === AD_STATES.PLAYING && (
          <div className="ad-card__status playing">
            🎬 Ad is playing…
          </div>
        )}

        {state === AD_STATES.CLAIMING && (
          <div className="ad-card__status loading">
            <span className="ad-card__spinner" />
            Claiming reward…
          </div>
        )}

        {state === AD_STATES.SUCCESS && (
          <div className="ad-card__result success">
            <div className="ad-card__result-icon">✅</div>
            <div className="ad-card__result-msg">{message}</div>
            <button className="ad-card__btn ad-card__btn--secondary" onClick={handleRetry}>
              Watch Another
            </button>
          </div>
        )}

        {state === AD_STATES.SKIPPED && (
          <div className="ad-card__result skipped">
            <div className="ad-card__result-icon">⏭️</div>
            <div className="ad-card__result-msg">{message}</div>
            <button className="ad-card__btn" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        )}

        {state === AD_STATES.ERROR && (
          <div className="ad-card__result error">
            <div className="ad-card__result-icon">⚠️</div>
            <div className="ad-card__result-msg">{message}</div>
            <button className="ad-card__btn" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        <p className="ad-card__note">
          Rewards are only issued after fully watching the ad
        </p>
      </div>
    </div>
  );
}
