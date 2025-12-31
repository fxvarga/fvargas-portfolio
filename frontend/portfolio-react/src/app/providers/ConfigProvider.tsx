import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppConfig } from '../../shared/types/AppConfig';

// Create a default configuration
const defaultConfig: AppConfig = {
  apiUrl: "https://localhost:7007/graphql",
  apiWsUrl: "wss://localhost:7007/graphql",
  environment: 'production',
  version: '1.0.0',
  flags: {
    showDevTools: false,
    enableAnalytics: true,
    enableContactForm: true,
  }
};

// Create the context
interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (featureName: string) => boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Provider props
interface ConfigProviderProps {
  children: ReactNode;
  configPath?: string;
  initialConfig?: Partial<AppConfig>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  configPath = '/config.json',
  initialConfig = {}
}) => {
  // Merge any initial config with default
  const mergedDefaultConfig: AppConfig = {
    ...defaultConfig,
    ...initialConfig,
    flags: {
      ...defaultConfig.flags,
      ...(initialConfig.flags || {}),
    }
  };

  const [config, setConfig] = useState<AppConfig>(mergedDefaultConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track config across async operations
  const configRef = useRef<AppConfig>(mergedDefaultConfig);

  // Keep the ref in sync with the state
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Helper function to parse the flags when they're returned as a string
  const parseFlags = (flagsData: any): Record<string, boolean> => {
    if (!flagsData) return {};

    // If it's already an object, return it
    if (typeof flagsData === 'object' && !Array.isArray(flagsData)) {
      return flagsData;
    }

    // If it's a string, try to parse it as JSON
    if (typeof flagsData === 'string') {
      try {
        return JSON.parse(flagsData);
      } catch (e) {
        console.error('Error parsing flags JSON:', e);
        // Return empty object if parsing fails
        return {};
      }
    }

    // If it's an array (like you're seeing in the character array), join and parse
    if (Array.isArray(flagsData)) {
      try {
        const flagsStr = flagsData.join('');
        return JSON.parse(flagsStr);
      } catch (e) {
        console.error('Error parsing flags array:', e);
        return {};
      }
    }

    // Fallback
    return {};
  };

  // Function to load config from file and then from API
  const loadConfig = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a working copy that we'll update and only set to state once
      let workingConfig = { ...configRef.current };

      // Step 1: First load the local config file to get initial apiUrl
      try {
        const fileResponse = await fetch(configPath);
        if (fileResponse.ok) {
          const fileConfig = await fileResponse.json();

          // Update our working copy with file values
          workingConfig = {
            ...workingConfig,
            ...fileConfig,
            flags: {
              ...workingConfig.flags,
              ...(fileConfig.flags || {})
            }
          };

          // Update state with file config first
          setConfig(workingConfig);
          // Update ref for immediate access
          configRef.current = workingConfig;
        }
      } catch (fileError) {
        console.log('Unable to load config from file, will try API with default URL:', fileError);
      }

      // Step 2: Now try to load from API using the current apiUrl from our working config
      try {
        // Use the working config's apiUrl which has any file updates
        const apiUrl = workingConfig.apiUrl;
        console.log(`Fetching config from API: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `query appConfigValues { appConfigValues { flags } }`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("API Response:", data);

          if (data?.data?.appConfigValues) {
            // Parse the flags if they're returned as a string or character array
            const parsedFlags = parseFlags(data.data.appConfigValues.flags);
            console.log("Parsed flags:", parsedFlags);

            // Update working config with API response and parsed flags
            workingConfig = {
              ...workingConfig,
              ...data.data.appConfigValues,
              flags: {
                ...workingConfig.flags,
                ...parsedFlags
              }
            };

            // Finally set the complete updated config
            setConfig(workingConfig);
            configRef.current = workingConfig;
          }
        }
      } catch (apiError) {
        console.error('Unable to load config from API:', apiError);
        // We still have the file config in workingConfig if that worked
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading config'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load config on component mount
  useEffect(() => {
    loadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configPath]);

  // Helper function to check if a feature is enabled
  const isFeatureEnabled = (featureName: string): boolean => {
    return !!config.flags[featureName];
  };

  // Provide a way to manually refresh the config
  const refreshConfig = async (): Promise<void> => {
    await loadConfig();
  };

  const value: ConfigContextType = {
    config,
    isLoading,
    error,
    isFeatureEnabled,
    refreshConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the config
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};