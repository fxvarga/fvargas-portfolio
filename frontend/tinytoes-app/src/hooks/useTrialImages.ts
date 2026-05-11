import { useState, useEffect, useCallback } from 'react';
import { isNativeApp } from '@/lib/storage-adapter';
import { entriesDb } from '@/lib/db';

const TRIAL_LIMIT = 5;

/**
 * Tracks how many food-log images the iOS user has in the database.
 * Counts actual entries with images (so imports count too).
 * Only active on native iOS; on web this is a no-op (always returns canAdd = true).
 */
export function useTrialImages() {
  const native = isNativeApp();
  const [count, setCount] = useState(0);

  const recount = useCallback(async () => {
    if (!native) return;
    try {
      const entries = await entriesDb.getAll();
      const withImages = entries.filter(e => !!e.image).length;
      setCount(withImages);
    } catch {
      // If storage fails, assume 0 to not block the user
      setCount(0);
    }
  }, [native]);

  useEffect(() => {
    recount();
  }, [recount]);

  const canAddImage = !native || count < TRIAL_LIMIT;
  const remaining = Math.max(0, TRIAL_LIMIT - count);

  return {
    count,
    remaining,
    canAddImage,
    trialLimit: TRIAL_LIMIT,
    /** Call after adding an entry with an image to refresh the count */
    recount,
    isNative: native,
  };
}
