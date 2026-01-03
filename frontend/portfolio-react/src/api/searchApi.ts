// Search API - Fetches search results from GraphQL backend
import { gql } from '@apollo/client';
import { getClient } from './apiProvider';

// Types
export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  section: string | null;
  entityType: string;
  score: number;
  highlights: string[];
}

export interface SearchQueryResult {
  query: string;
  results: SearchResultItem[];
  totalResults: number;
}

export interface SearchOptions {
  query: string;
  useSemanticSearch?: boolean;
  limit?: number;
  entityTypes?: string[];
}

// GraphQL Queries
const SEARCH_QUERY = gql`
  query Search(
    $query: String!
    $useSemanticSearch: Boolean
    $limit: Int
    $entityTypes: [String!]
  ) {
    search(
      query: $query
      useSemanticSearch: $useSemanticSearch
      limit: $limit
      entityTypes: $entityTypes
    ) {
      query
      totalResults
      results {
        id
        title
        snippet
        url
        section
        entityType
        score
        highlights
      }
    }
  }
`;

const SEARCH_SUGGESTIONS_QUERY = gql`
  query GetSearchSuggestions($prefix: String!, $limit: Int) {
    searchSuggestions(prefix: $prefix, limit: $limit)
  }
`;

const SEARCH_HEALTH_QUERY = gql`
  query IsSearchAvailable {
    isSearchAvailable
  }
`;

// Helper to safely get the client
const safeGetClient = () => {
  try {
    return getClient();
  } catch {
    return null;
  }
};

/**
 * Search for content
 */
export const search = async (options: SearchOptions): Promise<SearchQueryResult> => {
  try {
    const client = safeGetClient();
    if (!client) {
      return { query: options.query, results: [], totalResults: 0 };
    }
    const { data } = await client.query({
      query: SEARCH_QUERY,
      variables: {
        query: options.query,
        useSemanticSearch: options.useSemanticSearch ?? false,
        limit: options.limit ?? 10,
        entityTypes: options.entityTypes,
      },
      fetchPolicy: 'network-only',
    });
    return data.search;
  } catch (error) {
    console.error('Search failed:', error);
    return {
      query: options.query,
      results: [],
      totalResults: 0,
    };
  }
};

/**
 * Get autocomplete suggestions
 */
export const getSearchSuggestions = async (
  prefix: string,
  limit = 5
): Promise<string[]> => {
  if (!prefix || prefix.length < 2) {
    return [];
  }

  try {
    const client = safeGetClient();
    if (!client) {
      return [];
    }
    const { data } = await client.query({
      query: SEARCH_SUGGESTIONS_QUERY,
      variables: { prefix, limit },
      fetchPolicy: 'network-only',
    });
    return data.searchSuggestions ?? [];
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    return [];
  }
};

/**
 * Check if search is available
 */
export const isSearchAvailable = async (): Promise<boolean> => {
  try {
    const client = safeGetClient();
    if (!client) {
      return false;
    }
    const { data } = await client.query({
      query: SEARCH_HEALTH_QUERY,
      fetchPolicy: 'network-only',
    });
    return data.isSearchAvailable ?? false;
  } catch (error) {
    console.error('Search health check failed:', error);
    return false;
  }
};
