import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useProducts } from '@/hooks/useProducts';
import { api } from '@/lib/api';
import type { Product } from '@/types';

const PRODUCT_ICONS: Record<string, string> = {
  'first-foods': '🥄',
  'milestones': '🏆',
  'monthly-journal': '📖',
  'memory-book': '📸',
  'year-recap': '🎬',
  'first-year-bundle': '🎁',
};

const PRODUCT_HIGHLIGHTS: Record<string, string[]> = {
  'first-foods': ['Track every first bite', 'Photo entries & reactions', 'Works offline as a PWA'],
  'milestones': ['First smile to first steps', 'Photo + date tracking', 'Category organization'],
  'monthly-journal': ['Month-by-month memories', 'Photos & written entries', 'Highlight tags'],
  'memory-book': ['Beautiful printable PDF', 'Auto-organized by month', 'Gift-ready keepsake'],
  'year-recap': ['Shareable year summary', 'Stats & highlights', 'Beautiful visual layout'],
  'first-year-bundle': ['All 5 products included', 'Save over 40%', 'Unlock everything'],
};

export function StorePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { products: entitlements } = useEntitlements(isAuthenticated);
  const { products, isLoading: productsLoading } = useProducts();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  const handleBuy = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const { url } = await api.checkout(slug);
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoadingSlug(null);
    }
  };

  const standaloneProducts = products.filter(p => !p.isBundle);
  const bundle = products.find(p => p.isBundle);
  const totalIndividual = standaloneProducts.reduce((sum, p) => sum + p.priceUsd, 0);
  const savings = bundle ? totalIndividual - bundle.priceUsd : 0;

  const ownedCount = standaloneProducts.filter(p => entitlements.includes(p.slug)).length;
  const ownsAll = ownedCount === standaloneProducts.length;

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: 'var(--color-text)' }}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Store
        </h1>
      </header>

      <div className="px-4 space-y-4">
        {/* Ownership summary */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            {ownsAll ? '🎉' : '🛍️'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {ownsAll
                ? 'You own everything!'
                : `You own ${ownedCount} of ${standaloneProducts.length} modules`}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {ownsAll
                ? 'All modules are unlocked. Enjoy!'
                : 'Purchase more to unlock additional features.'}
            </p>
          </div>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Bundle CTA — only show if user doesn't own everything */}
            {bundle && !ownsAll && (
              <div
                className="rounded-2xl p-5 border-2 relative overflow-hidden"
                style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-panel)' }}
              >
                <div
                  className="absolute top-0 right-0 px-3 py-0.5 rounded-bl-xl text-[10px] font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  BEST VALUE
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{PRODUCT_ICONS[bundle.slug]}</span>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{bundle.name}</h3>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>{bundle.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(bundle.bundleIncludes?.split(',') || []).map(slug => {
                    const owned = entitlements.includes(slug);
                    return (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: owned ? 'var(--color-accent)' : 'var(--color-primary-light)',
                          color: owned ? 'var(--color-muted)' : 'var(--color-primary)',
                          textDecoration: owned ? 'line-through' : 'none',
                        }}
                      >
                        {PRODUCT_ICONS[slug]} {standaloneProducts.find(sp => sp.slug === slug)?.name || slug}
                        {owned && ' (Owned)'}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm line-through mr-2" style={{ color: 'var(--color-muted)' }}>
                      ${totalIndividual.toFixed(2)}
                    </span>
                    <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                      ${bundle.priceUsd.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold ml-2" style={{ color: 'var(--color-primary)' }}>
                      Save ${savings.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(bundle.slug)}
                    disabled={loadingSlug !== null}
                    className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {loadingSlug === bundle.slug ? <Spinner /> : null}
                    Get Bundle
                  </button>
                </div>
              </div>
            )}

            {/* Individual Products */}
            <div className="space-y-3">
              {standaloneProducts.map(product => (
                <StoreProductCard
                  key={product.slug}
                  product={product}
                  owned={entitlements.includes(product.slug)}
                  loadingSlug={loadingSlug}
                  onBuy={handleBuy}
                />
              ))}
            </div>
          </>
        )}

        {/* Claim code link */}
        <div className="text-center pt-4">
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
            Already purchased? Have a claim code?
          </p>
          <button
            onClick={() => navigate('/claim')}
            className="text-sm font-semibold transition-colors hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Activate a Code
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreProductCard({
  product,
  owned,
  loadingSlug,
  onBuy,
}: {
  product: Product;
  owned: boolean;
  loadingSlug: string | null;
  onBuy: (slug: string) => void;
}) {
  const icon = PRODUCT_ICONS[product.slug] || '📦';
  const highlights = PRODUCT_HIGHLIGHTS[product.slug] || [];

  return (
    <div
      className={`rounded-2xl p-4 transition-shadow ${owned ? '' : 'hover:shadow-md'}`}
      style={{
        backgroundColor: 'var(--color-panel)',
        opacity: owned ? 0.85 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
              {product.name}
            </h3>
            {owned && (
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#22c55e' }}
              >
                Owned
              </span>
            )}
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
            {product.description}
          </p>
          <ul className="space-y-0.5 mb-3">
            {highlights.map(h => (
              <li key={h} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--color-text)' }}>
                <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }}>✓</span>
                {h}
              </li>
            ))}
          </ul>
          {!owned && (
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold" style={{ color: 'var(--color-text)' }}>
                ${product.priceUsd.toFixed(2)}
              </span>
              <button
                onClick={() => onBuy(product.slug)}
                disabled={loadingSlug !== null || !product.isAvailable}
                className="inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loadingSlug === product.slug ? <Spinner /> : null}
                {product.isAvailable ? 'Buy Now' : 'Coming Soon'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
