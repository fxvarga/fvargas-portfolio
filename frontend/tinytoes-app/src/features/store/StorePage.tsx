import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, ShoppingBag, Check, Camera, Clapperboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useProducts } from '@/hooks/useProducts';
import { api } from '@/lib/api';
import { getProductIcon, getProductHighlights } from '@/lib/products';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import type { Product } from '@/types';

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
    <PageShell bottomPad="pb-8">
      <PageHeader title="Store" backButton />

      <div className="px-4 space-y-4">
        {/* Ownership summary */}
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-theme-panel">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-theme-primary-light">
            {ownsAll ? (
              <PartyPopper size={20} className="text-theme-primary" />
            ) : (
              <ShoppingBag size={20} className="text-theme-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-theme-text">
              {ownsAll
                ? 'You own everything!'
                : `You own ${ownedCount} of ${standaloneProducts.length} modules`}
            </p>
            <p className="text-xs text-theme-muted">
              {ownsAll
                ? 'All modules are unlocked. Enjoy!'
                : 'Purchase more to unlock additional features.'}
            </p>
          </div>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-theme-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Bundle CTA — only show if user doesn't own everything */}
            {bundle && !ownsAll && (
              <div className="rounded-2xl p-5 border-2 relative overflow-hidden border-theme-accent bg-theme-panel"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                <div className="absolute top-0 right-0 px-3 py-0.5 rounded-bl-xl text-[10px] font-bold text-white bg-theme-primary">
                  BEST VALUE
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const BundleIcon = getProductIcon(bundle.slug);
                    return <BundleIcon size={28} className="text-theme-primary" />;
                  })()}
                  <h3 className="text-lg font-bold text-theme-text">{bundle.name}</h3>
                </div>
                <p className="text-xs mb-3 text-theme-muted">{bundle.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(bundle.bundleIncludes?.split(',') || []).map(slug => {
                    const owned = entitlements.includes(slug);
                    const SlugIcon = getProductIcon(slug);
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
                        <SlugIcon size={10} /> {standaloneProducts.find(sp => sp.slug === slug)?.name || slug}
                        {owned && ' (Owned)'}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm line-through mr-2 text-theme-muted">
                      ${totalIndividual.toFixed(2)}
                    </span>
                    <span className="text-xl font-extrabold text-theme-primary">
                      ${bundle.priceUsd.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold ml-2 text-theme-primary">
                      Save ${savings.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(bundle.slug)}
                    disabled={loadingSlug !== null}
                    className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50 bg-theme-primary"
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

            {/* Free features callout */}
            <div className="rounded-2xl p-4 border border-dashed bg-theme-panel" style={{ borderColor: 'var(--color-accent)' }}>
              <h4 className="text-sm font-semibold mb-2 text-theme-text">
                Included free with any purchase
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-theme-muted">
                  <Camera size={14} className="text-theme-primary shrink-0" />
                  <span><span className="font-medium text-theme-text">Memory Book</span> — printable keepsake of your baby's journey</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-theme-muted">
                  <Clapperboard size={14} className="text-theme-primary shrink-0" />
                  <span><span className="font-medium text-theme-text">Year Recap</span> — beautiful visual summary of the first year</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Claim code link */}
        <div className="text-center pt-4">
          <p className="text-xs mb-2 text-theme-muted">
            Already purchased? Have a claim code?
          </p>
          <button
            onClick={() => navigate('/claim')}
            className="text-sm font-semibold transition-colors hover:underline text-theme-primary"
          >
            Activate a Code
          </button>
        </div>
      </div>
    </PageShell>
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
  const Icon = getProductIcon(product.slug);
  const highlights = getProductHighlights(product.slug);

  return (
    <div
      className={`rounded-2xl p-4 transition-shadow bg-theme-panel ${owned ? '' : 'hover:shadow-md'}`}
      style={{ opacity: owned ? 0.85 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-theme-primary-light">
          <Icon size={20} className="text-theme-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm text-theme-text">
              {product.name}
            </h3>
            {owned && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#22c55e' }}
              >
                Owned
              </span>
            )}
          </div>
          <p className="text-xs mb-2 text-theme-muted">
            {product.description}
          </p>
          <ul className="space-y-0.5 mb-3">
            {highlights.map(h => (
              <li key={h} className="flex items-start gap-1.5 text-[11px] text-theme-text">
                <span className="mt-0.5 shrink-0 text-theme-primary"><Check size={12} /></span>
                {h}
              </li>
            ))}
          </ul>
          {!owned && (
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-theme-text">
                ${product.priceUsd.toFixed(2)}
              </span>
              <button
                onClick={() => onBuy(product.slug)}
                disabled={loadingSlug !== null || !product.isAvailable}
                className="inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50 bg-theme-primary"
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
