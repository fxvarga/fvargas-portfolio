// ============================================================
// ConfigProvider — Generic config loader for portfolio apps.
//
// Loads config from a local JSON file, then optionally overlays
// values from the GraphQL API's appConfigValues query.
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { AppConfig, FeatureFlags } from './types';

const defaultConfig: AppConfig = {
  apiUrl: 'https://localhost:7007/graphql',
  apiWsUrl: 'wss://localhost:7007/graphql',
  environment: 'production',
  version: '1.0.0',
  flags: {},
};

interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (featureName: string) => boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  /** Path to the local config.json file. Defaults to "/config.json". */
  configPath?: string;
  /** Initial overrides merged with defaults before loading. */
  initialConfig?: Partial<AppConfig>;
}

/** Parse flags that may be returned as string, array, or object. */
function parseFlags(flagsData: unknown): FeatureFlags {
  if (!flagsData) return {};
  if (typeof flagsData === 'object' && !Array.isArray(flagsData)) return flagsData as FeatureFlags;
  if (typeof flagsData === 'string') {
    try { return JSON.parse(flagsData); } catch { return {}; }
  }
  if (Array.isArray(flagsData)) {
    try { return JSON.parse(flagsData.join('')); } catch { return {}; }
  }
  return {};
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  configPath = '/config.json',
  initialConfig = {},
}) => {
  const mergedDefault: AppConfig = {
    ...defaultConfig,
    ...initialConfig,
    flags: { ...defaultConfig.flags, ...(initialConfig.flags || {}) },
  };

  const [config, setConfig] = useState<AppConfig>(mergedDefault);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const configRef = useRef<AppConfig>(mergedDefault);

  useEffect(() => { configRef.current = config; }, [config]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let working = { ...configRef.current };

      // Step 1: Load local config file
      try {
        const res = await fetch(configPath);
        if (res.ok) {
          const fileConfig = await res.json();
          working = { ...working, ...fileConfig, flags: { ...working.flags, ...(fileConfig.flags || {}) } };
          setConfig(working);
          configRef.current = working;
        }
      } catch { /* file not available, continue */ }

      // Step 2: Overlay from API
      try {
        const res = await fetch(working.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'query { appConfigValues { flags } }' }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.appConfigValues) {
            const parsedFlags = parseFlags(json.data.appConfigValues.flags);
            working = { ...working, ...json.data.appConfigValues, flags: { ...working.flags, ...parsedFlags } };
            setConfig(working);
            configRef.current = working;
          }
        }
      } catch { /* API not available */ }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error loading config'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, [configPath]);

  const value: ConfigContextType = {
    config,
    isLoading,
    error,
    isFeatureEnabled: (name: string) => !!config.flags[name],
    refreshConfig: loadConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
