// ============================================================
// Types for @fvargas/portfolio-cms-client
// ============================================================

export interface FeatureFlags {
  [key: string]: boolean;
}

/** Generic app configuration. Host apps can extend this. */
export interface AppConfig {
  apiUrl: string;
  apiWsUrl: string;
  environment: string;
  flags: FeatureFlags;
  version: string;
}

/** A single published CMS entity record from the GraphQL API. */
export interface EntityRecord<T = unknown> {
  id: string;
  entityType: string;
  slug?: string;
  data: T;
  version: number;
  publishedAt: string;
  updatedAt: string;
}
