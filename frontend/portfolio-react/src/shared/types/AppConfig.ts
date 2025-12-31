export interface FeatureFlags {
  showDevTools: boolean;
  enableAnalytics: boolean;
  enableContactForm: boolean;
  [key: string]: boolean;
}

export interface AppConfig {
  apiUrl: string;
  apiWsUrl: string;
  environment: string;
  flags: FeatureFlags;
  version: string;
}