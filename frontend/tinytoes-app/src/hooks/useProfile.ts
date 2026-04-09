import { useState, useEffect, useCallback } from 'react';
import { profileDb } from '@/lib/db';
import type { BabyProfile } from '@/types';

const DEFAULT_PROFILE: BabyProfile = {
  name: '',
  ageRange: '6–9 months',
  theme: 'Neutral',
  photo: null,
  onboardingComplete: false,
};

export function useProfile() {
  const [profile, setProfile] = useState<BabyProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const stored = await profileDb.get();
      if (stored) setProfile(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<BabyProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await profileDb.set(updated);
  }, [profile]);

  const resetProfile = useCallback(async () => {
    setProfile(DEFAULT_PROFILE);
    await profileDb.clear();
  }, []);

  return { profile, isLoading, updateProfile, resetProfile, loadProfile };
}
