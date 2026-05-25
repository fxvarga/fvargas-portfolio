// AdminConfigProvider — dependency injection for the admin module.
// Replaces the two external coupling points:
//   1. getClient() from apiProvider (Apollo Client)
//   2. useConfig().config.apiUrl from ConfigProvider

import React, { createContext, useContext } from 'react';
import type { ApolloClient } from '@apollo/client';

export interface AdminConfig {
  /** Returns a configured Apollo Client instance. */
  getClient: () => ApolloClient<unknown>;
  /** REST API base URL (e.g. "https://api.example.com" — no trailing slash, no /graphql). */
  apiBaseUrl: string;
}

const AdminConfigContext = createContext<AdminConfig | null>(null);

export const AdminConfigProvider: React.FC<{
  config: AdminConfig;
  children: React.ReactNode;
}> = ({ config, children }) => (
  <AdminConfigContext.Provider value={config}>
    {children}
  </AdminConfigContext.Provider>
);

export function useAdminConfig(): AdminConfig {
  const ctx = useContext(AdminConfigContext);
  if (!ctx) {
    throw new Error('useAdminConfig must be used within an AdminConfigProvider');
  }
  return ctx;
}

/** Convenience: returns the Apollo client. Drop-in for old getClient(). */
export function getClient(): ApolloClient<unknown> {
  // This is a module-level shim. It gets set by AdminApp on mount.
  if (!_clientGetter) {
    throw new Error('Admin client not initialized. Wrap with AdminConfigProvider.');
  }
  return _clientGetter();
}

// Module-level holder so non-hook code (like AuthContext) can call getClient()
let _clientGetter: (() => ApolloClient<unknown>) | null = null;

/** Called once by AdminApp to wire up the module-level getClient. */
export function _setClientGetter(fn: () => ApolloClient<unknown>) {
  _clientGetter = fn;
}
