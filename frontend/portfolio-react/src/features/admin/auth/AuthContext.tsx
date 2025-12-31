import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';

// Types
export interface User {
  id: string;
  username: string;
  role: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// GraphQL mutation
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      token
      user {
        id
        username
        role
      }
      errorMessage
    }
  }
`;

// Storage keys
const TOKEN_KEY = 'cms_auth_token';
const USER_KEY = 'cms_auth_user';

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        });
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const client = getClient();
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          input: { username, password }
        }
      });

      const result = data.login;

      if (result.success && result.token && result.user) {
        // Store in localStorage
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));

        setState({
          isAuthenticated: true,
          user: result.user,
          token: result.token,
          isLoading: false,
        });

        return { success: true };
      } else {
        return { success: false, error: result.errorMessage || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Get stored token for API calls
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};
