import { useState, useCallback, useEffect, useRef } from 'react';
import {
  search,
  getSearchSuggestions,
  isSearchAvailable,
  SearchResultItem,
  SearchOptions,
} from '../../api/searchApi';

export interface UseSearchOptions {
  /** Debounce delay in ms for suggestions (default: 200) */
  debounceMs?: number;
  /** Minimum characters before fetching suggestions (default: 2) */
  minCharsForSuggestions?: number;
  /** Maximum suggestions to show (default: 5) */
  maxSuggestions?: number;
  /** Whether to use semantic/AI search (default: false) */
  useSemanticSearch?: boolean;
  /** Maximum results (default: 10) */
  limit?: number;
  /** Filter by entity types */
  entityTypes?: string[];
}

export interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResultItem[];
  /** Autocomplete suggestions */
  suggestions: string[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Whether suggestions are loading */
  isLoadingSuggestions: boolean;
  /** Whether search service is available */
  isAvailable: boolean;
  /** Total results count */
  totalResults: number;
  /** Execute a search */
  executeSearch: (query?: string) => Promise<void>;
  /** Clear search results */
  clearResults: () => void;
  /** Select a suggestion (sets query and executes search) */
  selectSuggestion: (suggestion: string) => void;
}

/**
 * Custom hook for search functionality with autocomplete
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 200,
    minCharsForSuggestions = 2,
    maxSuggestions = 5,
    useSemanticSearch = false,
    limit = 10,
    entityTypes,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if search is available on mount (with retry)
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const checkAvailability = async () => {
      try {
        const available = await isSearchAvailable();
        if (mounted) {
          setIsAvailable(available);
        }
      } catch (error) {
        console.warn('Search availability check failed:', error);
        // Retry a few times in case Apollo isn't ready yet
        if (retryCount < maxRetries && mounted) {
          retryCount++;
          setTimeout(checkAvailability, retryDelay);
        }
      }
    };

    // Small delay to ensure Apollo client is initialized
    const timeoutId = setTimeout(checkAvailability, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Debounced suggestions fetching
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.length < minCharsForSuggestions) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const fetchedSuggestions = await getSearchSuggestions(query, maxSuggestions);
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, debounceMs, minCharsForSuggestions, maxSuggestions]);

  const executeSearch = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery ?? query;
      if (!q.trim()) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setIsSearching(true);
      try {
        const searchOptions: SearchOptions = {
          query: q,
          useSemanticSearch,
          limit,
          entityTypes,
        };
        const result = await search(searchOptions);
        setResults(result.results);
        setTotalResults(result.totalResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsSearching(false);
      }
    },
    [query, useSemanticSearch, limit, entityTypes]
  );

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setTotalResults(0);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setSuggestions([]);
      executeSearch(suggestion);
    },
    [executeSearch]
  );

  return {
    query,
    setQuery,
    results,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    isAvailable,
    totalResults,
    executeSearch,
    clearResults,
    selectSuggestion,
  };
}
