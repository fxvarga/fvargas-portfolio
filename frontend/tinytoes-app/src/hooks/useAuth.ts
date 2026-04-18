import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { SessionInfo } from '@/types';

const SESSION_CACHE_KEY = 'tinytoes-session';
const ENTITLEMENTS_CACHE_KEY = 'tinytoes-entitlements';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: SessionInfo | null;
  error: string | null;
}

function loadCachedSession(): { isAuthenticated: boolean; session: SessionInfo | null } {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as SessionInfo;
      return { isAuthenticated: true, session };
    }
  } catch {
    localStorage.removeItem(SESSION_CACHE_KEY);
  }
  return { isAuthenticated: false, session: null };
}

export function useAuth() {
  const cached = loadCachedSession();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: cached.isAuthenticated,
    isLoading: !cached.isAuthenticated,
    session: cached.session,
    error: null,
  });

  const checkSession = useCallback(async () => {
    try {
      const session = await api.getSession();
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
      setState({
        isAuthenticated: true,
        isLoading: false,
        session,
        error: null,
      });
    } catch {
      // Server says no session — clear cache and mark unauthenticated
      localStorage.removeItem(SESSION_CACHE_KEY);
      localStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
      setState({
        isAuthenticated: false,
        isLoading: false,
        session: null,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const claim = useCallback(async (email: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await api.claim(email, code);
      await checkSession();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem(SESSION_CACHE_KEY);
    localStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
    setState({
      isAuthenticated: false,
      isLoading: false,
      session: null,
      error: null,
    });
  }, []);

  return { ...state, claim, logout, checkSession };
}
