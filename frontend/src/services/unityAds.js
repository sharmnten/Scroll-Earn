/**
 * Unity Ads Web SDK integration helper.
 *
 * Unity Ads provides a Web SDK for browser-based integrations.
 * Full docs: https://docs.unity.com/ads/en-us/manual/WebSDK
 *
 * In production:
 *  1. Replace GAME_ID with your Unity Ads game ID from the Unity dashboard.
 *  2. Replace PLACEMENT_ID with your rewarded placement ID.
 *  3. The SDK script is loaded dynamically so it does not block the app.
 *
 * Ad flow:
 *  1. Call initUnityAds() once on app startup.
 *  2. Call showRewardedAd(callbacks) when user taps "Watch Ad to Earn".
 *  3. The SDK fires onComplete when user finishes the ad.
 *  4. ONLY credit the user after onComplete fires — never on a timer.
 */

// Replace these with real IDs from your Unity Ads dashboard
const GAME_ID = process.env.REACT_APP_UNITY_GAME_ID || 'YOUR_UNITY_GAME_ID';
const PLACEMENT_ID = process.env.REACT_APP_UNITY_PLACEMENT_ID || 'rewardedVideo';
const TEST_MODE = process.env.REACT_APP_UNITY_TEST_MODE !== 'false'; // default true for safety

let sdkReady = false;
let sdkLoading = false;

/**
 * Dynamically load the Unity Ads Web SDK script.
 */
function loadSDKScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('unity-ads-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'unity-ads-sdk';
    script.src = 'https://sdk.unity3d.com/v4.0/UnityAds.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Unity Ads SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize the Unity Ads SDK.
 * Should be called once when the app starts.
 */
export async function initUnityAds() {
  if (sdkReady || sdkLoading) return;
  sdkLoading = true;

  try {
    await loadSDKScript();

    await new Promise((resolve, reject) => {
      window.unityads.initialize(GAME_ID, {
        testMode: TEST_MODE,
        onComplete: () => {
          sdkReady = true;
          sdkLoading = false;
          console.log('[UnityAds] SDK initialized successfully');
          resolve();
        },
        onFailed: (error, message) => {
          sdkLoading = false;
          console.error('[UnityAds] Init failed:', error, message);
          reject(new Error(message));
        },
      });
    });
  } catch (err) {
    sdkLoading = false;
    console.error('[UnityAds] SDK load error:', err.message);
  }
}

/**
 * Check if a rewarded ad is ready to show.
 */
export function isAdReady() {
  if (!sdkReady || !window.unityads) return false;
  return window.unityads.isReady(PLACEMENT_ID);
}

/**
 * Show a rewarded video ad.
 *
 * @param {object} callbacks
 * @param {function} callbacks.onStart     - fired when ad starts playing
 * @param {function} callbacks.onComplete  - fired when ad is completed (user watched fully) — credit wallet here
 * @param {function} callbacks.onSkip      - fired when user skips the ad — do NOT credit
 * @param {function} callbacks.onError     - fired on error
 */
export function showRewardedAd({ onStart, onComplete, onSkip, onError } = {}) {
  if (!sdkReady || !window.unityads) {
    const msg = 'Unity Ads SDK not ready';
    console.warn('[UnityAds]', msg);
    onError?.(msg);
    return;
  }

  window.unityads.show(PLACEMENT_ID, {
    onStart: () => {
      console.log('[UnityAds] Ad started');
      onStart?.();
    },
    onComplete: () => {
      console.log('[UnityAds] Ad completed — eligible for reward');
      onComplete?.();
    },
    onSkipped: () => {
      console.log('[UnityAds] Ad skipped — no reward');
      onSkip?.();
    },
    onFailed: (error, message) => {
      console.error('[UnityAds] Ad failed:', error, message);
      onError?.(message || error);
    },
  });
}

export { PLACEMENT_ID, GAME_ID };
