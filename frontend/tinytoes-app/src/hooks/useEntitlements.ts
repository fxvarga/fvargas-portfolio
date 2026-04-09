import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ProductSlug } from '@/types';

interface EntitlementsState {
  products: string[];
  isLoading: boolean;
  error: string | null;
}

export function useEntitlements(isAuthenticated: boolean) {
  const [state, setState] = useState<EntitlementsState>({
    products: [],
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ products: [], isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await api.getEntitlements();
      setState({ products: data.products, isLoading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load entitlements.' }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasProduct = useCallback(
    (slug: ProductSlug) => state.products.includes(slug),
    [state.products]
  );

  return { ...state, hasProduct, refresh };
}
