import { useState, useEffect, useCallback } from 'react';
import { isNativeApp } from '@/lib/storage-adapter';

const TRIAL_COUNT_KEY = 'tinytoes-trial-image-count';
const TRIAL_LIMIT = 5;

/**
 * Tracks how many food-log images the iOS user has added during the free trial.
 * Only active on native iOS; on web this is a no-op (always returns canAdd = true).
 */
export function useTrialImages() {
  const native = isNativeApp();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!native) return;
    const stored = parseInt(localStorage.getItem(TRIAL_COUNT_KEY) || '0', 10);
    setCount(stored);
  }, [native]);

  const increment = useCallback(() => {
    if (!native) return;
    const next = count + 1;
    localStorage.setItem(TRIAL_COUNT_KEY, String(next));
    setCount(next);
  }, [native, count]);

  const canAddImage = !native || count < TRIAL_LIMIT;
  const remaining = Math.max(0, TRIAL_LIMIT - count);

  return {
    count,
    remaining,
    canAddImage,
    trialLimit: TRIAL_LIMIT,
    increment,
    isNative: native,
  };
}
