import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { isNativeApp } from '@/lib/storage-adapter';
import { CORE_PRODUCT_SLUGS, type ProductSlug } from '@/types';

const CACHE_KEY = 'tinytoes-entitlements';

interface EntitlementsState {
  products: string[];
  isLoading: boolean;
  error: string | null;
}

function loadCachedProducts(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const products = JSON.parse(raw);
      if (Array.isArray(products)) return products;
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
  return [];
}

export function useEntitlements(isAuthenticated: boolean) {
  const cachedProducts = loadCachedProducts();

  const [state, setState] = useState<EntitlementsState>({
    products: isAuthenticated ? cachedProducts : [],
    isLoading: isAuthenticated && cachedProducts.length === 0,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (isNativeApp() && window.nativeIAP) {
      try {
        const status = await window.nativeIAP.getStatus();
        if (status.purchased) {
          const products = [...CORE_PRODUCT_SLUGS];
          localStorage.setItem(CACHE_KEY, JSON.stringify(products));
          setState({ products, isLoading: false, error: null });
          return;
        }
      } catch {
        // Fall through to web/session entitlement handling below.
      }
    }

    if (!isAuthenticated) {
      // Imported content does not grant ownership. Without an authenticated
      // claim-code session or a verified native StoreKit entitlement, keep
      // premium modules locked even if the imported backup contains premium
      // data from another device/account.
      localStorage.removeItem(CACHE_KEY);
      setState({ products: [], isLoading: false, error: null });
      return;
    }

    // Only show loading if we have no cached data
    setState(prev => ({
      ...prev,
      isLoading: prev.products.length === 0,
      error: null,
    }));

    try {
      const data = await api.getEntitlements();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.products));
      setState({ products: data.products, isLoading: false, error: null });
    } catch {
      // If we have cached data, silently keep it; only show error if no cache
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: prev.products.length === 0 ? 'Failed to load entitlements.' : null,
      }));
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
