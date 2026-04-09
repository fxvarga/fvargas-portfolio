import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getProducts();
        if (!cancelled) {
          setProducts(data);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load products.');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { products, isLoading, error };
}
