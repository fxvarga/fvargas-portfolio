// ============================================================
// CmsProvider — Generic CMS data provider.
//
// Fetches entity data from the GraphQL API using plain fetch
// (no Apollo dependency). Provides generic hooks:
//   useEntity<T>(entityType)      — singleton entity
//   useCollection<T>(entityType)  — collection of entities
//
// Also exposes preview context plumbing so PreviewProvider can
// override entity data without re-fetching.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { EntityRecord } from './types';

// ---- GraphQL helpers (no Apollo) ----

interface CmsProviderConfig {
  apiUrl: string;
  portfolioId?: string;
  token?: string | null;
}

async function gqlFetch<T>(
  config: CmsProviderConfig,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
  if (config.portfolioId) headers['X-Portfolio-Id'] = config.portfolioId;

  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ---- Queries ----

const QUERY_SINGLE = `
  query GetPublishedContentSingle($entityType: String!) {
    publishedContentSingle(entityType: $entityType) {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

const QUERY_COLLECTION = `
  query GetPublishedContent($entityType: String!) {
    publishedContent(entityType: $entityType) {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

// ---- Context ----

interface CmsContextValue {
  /** Fetch a singleton entity. Cached after first load. */
  getEntity: <T = unknown>(entityType: string) => EntityRecord<T> | null;
  /** Fetch a collection entity. Cached after first load. */
  getCollection: <T = unknown>(entityType: string) => EntityRecord<T>[];
  /** Whether any initial fetch is in-flight. */
  isLoading: boolean;
  /** Last error if any. */
  error: Error | null;
  /** Re-fetch all cached entity types. */
  refetch: () => Promise<void>;
  /** Preload specific entity types (call from app init). */
  preload: (entityTypes: string[], collectionTypes?: string[]) => Promise<void>;
}

const CmsContext = createContext<CmsContextValue | undefined>(undefined);

/**
 * Preview override context. When set, useEntity/useCollection return
 * preview-merged data instead of real data.
 */
export interface CmsPreviewOverrides {
  /** entityType → cloned data object with field-level overrides applied */
  singletons: Record<string, unknown>;
  /** entityType → { recordId → partial field overrides } */
  collections: Record<string, Record<string, Record<string, unknown>>>;
  /** entityType → Set of recordIds marked for deletion */
  deletions?: Record<string, Set<string>>;
}

export const CmsPreviewContext = createContext<CmsPreviewOverrides | undefined>(undefined);

// ---- Provider ----

interface CmsProviderProps {
  children: ReactNode;
  config: CmsProviderConfig;
  /** Entity types to preload as singletons on mount. */
  preloadSingletons?: string[];
  /** Entity types to preload as collections on mount. */
  preloadCollections?: string[];
}

/** Parse JSON string fields from GraphQL (data field may come as string). */
function parseData<T>(raw: unknown): T {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }
  return raw as T;
}

export const CmsProvider: React.FC<CmsProviderProps> = ({
  children,
  config,
  preloadSingletons = [],
  preloadCollections = [],
}) => {
  const [singletons, setSingletons] = useState<Record<string, EntityRecord>>({});
  const [collections, setCollections] = useState<Record<string, EntityRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track which types we've loaded so refetch knows what to reload
  const [loadedSingletonTypes, setLoadedSingletonTypes] = useState<Set<string>>(new Set());
  const [loadedCollectionTypes, setLoadedCollectionTypes] = useState<Set<string>>(new Set());

  const fetchSingleton = useCallback(async (entityType: string): Promise<EntityRecord | null> => {
    try {
      const data = await gqlFetch<{ publishedContentSingle: EntityRecord | null }>(
        config, QUERY_SINGLE, { entityType },
      );
      const record = data.publishedContentSingle;
      if (record) {
        record.data = parseData(record.data);
      }
      return record;
    } catch (err) {
      console.warn(`[CmsProvider] Failed to fetch singleton "${entityType}":`, err);
      return null;
    }
  }, [config]);

  const fetchCollection = useCallback(async (entityType: string): Promise<EntityRecord[]> => {
    try {
      const data = await gqlFetch<{ publishedContent: EntityRecord[] }>(
        config, QUERY_COLLECTION, { entityType },
      );
      return (data.publishedContent || []).map(r => ({ ...r, data: parseData(r.data) }));
    } catch (err) {
      console.warn(`[CmsProvider] Failed to fetch collection "${entityType}":`, err);
      return [];
    }
  }, [config]);

  const preload = useCallback(async (singletonTypes: string[], collectionTypes: string[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const [singletonResults, collectionResults] = await Promise.all([
        Promise.all(singletonTypes.map(async (t) => [t, await fetchSingleton(t)] as const)),
        Promise.all(collectionTypes.map(async (t) => [t, await fetchCollection(t)] as const)),
      ]);

      setSingletons(prev => {
        const next = { ...prev };
        for (const [type, record] of singletonResults) {
          if (record) next[type] = record;
        }
        return next;
      });

      setCollections(prev => {
        const next = { ...prev };
        for (const [type, records] of collectionResults) {
          next[type] = records;
        }
        return next;
      });

      setLoadedSingletonTypes(prev => {
        const next = new Set(prev);
        singletonTypes.forEach(t => next.add(t));
        return next;
      });

      setLoadedCollectionTypes(prev => {
        const next = new Set(prev);
        collectionTypes.forEach(t => next.add(t));
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to preload CMS data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchSingleton, fetchCollection]);

  const refetch = useCallback(async () => {
    await preload(Array.from(loadedSingletonTypes), Array.from(loadedCollectionTypes));
  }, [preload, loadedSingletonTypes, loadedCollectionTypes]);

  // Preload on mount
  useEffect(() => {
    if (preloadSingletons.length > 0 || preloadCollections.length > 0) {
      preload(preloadSingletons, preloadCollections);
    } else {
      setIsLoading(false);
    }
  }, []); // intentional: only on mount

  const value = useMemo<CmsContextValue>(() => ({
    getEntity: <T,>(entityType: string) => {
      const record = singletons[entityType];
      return record ? (record as unknown as EntityRecord<T>) : null;
    },
    getCollection: <T,>(entityType: string) => {
      return (collections[entityType] || []) as unknown as EntityRecord<T>[];
    },
    isLoading,
    error,
    refetch,
    preload,
  }), [singletons, collections, isLoading, error, refetch, preload]);

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

// ---- Hooks ----

/** Access the raw CMS context (ignoring preview overrides). */
export const useRealCms = (): CmsContextValue => {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useRealCms must be used within a CmsProvider');
  return ctx;
};

/**
 * Generic hook: get a singleton entity's data, with preview overrides applied.
 * Returns `{ data, isLoading, error }`.
 */
export function useEntity<T = unknown>(entityType: string): {
  data: T | null;
  record: EntityRecord<T> | null;
  isLoading: boolean;
  error: Error | null;
} {
  const ctx = useContext(CmsContext);
  const preview = useContext(CmsPreviewContext);
  if (!ctx) throw new Error('useEntity must be used within a CmsProvider');

  const record = ctx.getEntity<T>(entityType);

  // If preview overrides exist for this entity type, use them
  if (preview?.singletons[entityType] !== undefined) {
    return {
      data: preview.singletons[entityType] as T,
      record: record ? { ...record, data: preview.singletons[entityType] as T } : null,
      isLoading: ctx.isLoading,
      error: ctx.error,
    };
  }

  return {
    data: record?.data ?? null,
    record,
    isLoading: ctx.isLoading,
    error: ctx.error,
  };
}

/**
 * Generic hook: get a collection of entities, with preview overrides applied.
 */
export function useCollection<T = unknown>(entityType: string): {
  records: EntityRecord<T>[];
  isLoading: boolean;
  error: Error | null;
} {
  const ctx = useContext(CmsContext);
  const preview = useContext(CmsPreviewContext);
  if (!ctx) throw new Error('useCollection must be used within a CmsProvider');

  let records = ctx.getCollection<T>(entityType);

  // Apply per-record preview overrides if any
  if (preview?.collections[entityType]) {
    const overrides = preview.collections[entityType];
    records = records.map(r => {
      const fieldOverrides = overrides[r.id];
      if (!fieldOverrides) return r;
      return { ...r, data: { ...r.data, ...fieldOverrides } as T };
    });
  }

  // Filter out records marked for deletion in preview
  if (preview?.deletions?.[entityType]) {
    const deletedIds = preview.deletions[entityType];
    records = records.filter(r => !deletedIds.has(r.id));
  }

  return { records, isLoading: ctx.isLoading, error: ctx.error };
}
