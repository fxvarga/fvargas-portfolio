import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CORE_PRODUCT_SLUGS, type ProductSlug } from '@/types';

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

  /** User owns at least one core product (first-foods, milestones, or monthly-journal) */
  const hasAnyCoreProduct = useCallback(
    () => CORE_PRODUCT_SLUGS.some(slug => state.products.includes(slug)),
    [state.products]
  );

  return { ...state, hasProduct, hasAnyCoreProduct, refresh };
}
