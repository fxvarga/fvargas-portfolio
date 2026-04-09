import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { SessionInfo } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: SessionInfo | null;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    error: null,
  });

  const checkSession = useCallback(async () => {
    try {
      const session = await api.getSession();
      setState({
        isAuthenticated: true,
        isLoading: false,
        session,
        error: null,
      });
    } catch {
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
    setState({
      isAuthenticated: false,
      isLoading: false,
      session: null,
      error: null,
    });
  }, []);

  return { ...state, claim, logout, checkSession };
}
