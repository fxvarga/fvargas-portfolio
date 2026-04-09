import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  'milestones': ['First smile to first steps', 'Photo + date tracking', 'Share milestone cards'],
  'monthly-journal': ['Month-by-month memories', 'Photos & written entries', 'Growth notes'],
  'memory-book': ['Beautiful printable PDF', 'Auto-organized by month', 'Gift-ready keepsake'],
  'year-recap': ['Shareable year summary', 'Stats & highlights', 'Beautiful visual layout'],
  'first-year-bundle': ['All 5 products included', 'Save over 40%', 'Unlock everything'],
};

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate('/home', { replace: true });
    return null;
  }

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              🦶
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>TinyToesAndUs</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/claim')}
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-gray-100"
              style={{ color: 'var(--color-text)' }}
            >
              I have a code
            </button>
            {bundle && (
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97]"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                View Products
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--color-primary)' }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <span>✨</span>
              <span>Capture every precious moment</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" style={{ color: 'var(--color-text)' }}>
              Your Baby's<br />
              <span style={{ color: 'var(--color-primary)' }}>First Year</span>,<br />
              Remembered Forever
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--color-muted)' }}>
              From first bites to first steps — track milestones, journal memories, and create beautiful keepsakes. Pick the tools that fit your family, or get them all.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                See All Products
              </button>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                One-time purchases. No subscriptions.
              </p>
            </div>

            {/* Hero mock device */}
            <div className="relative max-w-xs mx-auto mt-4">
              <div className="rounded-3xl shadow-2xl overflow-hidden border-4 border-white" style={{ backgroundColor: 'var(--color-panel)' }}>
                <div className="px-5 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg" style={{ backgroundColor: 'var(--color-primary-light)' }}>🦶</div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Emma's Journal</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>6-9 months</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {['🥑 Avocado', '🍌 Banana', '🥕 Carrots', '🍠 Sweet Potato'].map((food, i) => (
                      <div key={food} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
                        <div className="text-2xl mb-1">{['😍', '😍', '😐', '😍'][i]}</div>
                        <div className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{food}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs px-1" style={{ color: 'var(--color-muted)' }}>
                    <span>4 foods tried</span>
                    <span>3 loved!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section id="products" className="py-20" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              Choose What Fits Your Family
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              Buy just what you need, or save with the bundle. Every product is a one-time purchase.
            </p>
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
              {/* Bundle CTA */}
              {bundle && (
                <div className="mb-10 rounded-2xl p-6 sm:p-8 border-2 relative overflow-hidden" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-background)' }}>
                  <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    BEST VALUE
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{PRODUCT_ICONS[bundle.slug]}</span>
                        <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{bundle.name}</h3>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>{bundle.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(bundle.bundleIncludes?.split(',') || []).map(slug => {
                          const p = standaloneProducts.find(sp => sp.slug === slug);
                          return p ? (
                            <span key={slug} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                              {PRODUCT_ICONS[slug]} {p.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="text-sm line-through mb-1" style={{ color: 'var(--color-muted)' }}>
                        ${totalIndividual.toFixed(2)}
                      </div>
                      <div className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-primary)' }}>
                        ${bundle.priceUsd.toFixed(2)}
                      </div>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                        Save ${savings.toFixed(2)}
                      </div>
                      <BuyButton product={bundle} loadingSlug={loadingSlug} onBuy={handleBuy} />
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {standaloneProducts.map(product => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    loadingSlug={loadingSlug}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              Ready in 2 minutes
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              No app store. No accounts. Just a code and you're in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Purchase', desc: 'Pick the products you want. You\'ll receive a claim code by email for each one.' },
              { step: '2', title: 'Activate', desc: 'Open the app, enter your email and claim code. Each code unlocks a feature.' },
              { step: '3', title: 'Enjoy', desc: 'Start capturing memories. Your data stays private on your device.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              Parents love it
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { quote: 'I wish I had this when my first was starting solids. Now I have every single moment captured for baby #2.', author: 'Sarah M.', detail: 'Mom of two' },
              { quote: 'The memory book feature made me cry — in the best way. Printed it for the grandparents and they loved it.', author: 'Jessica R.', detail: 'First-time mom' },
              { quote: 'So simple to use. I can add an entry in 30 seconds between bites. And the themes are adorable.', author: 'Priya K.', detail: 'Mom of one' },
            ].map(t => (
              <div key={t.author} className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-background)' }}>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: 'var(--color-text)' }}>"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{t.author}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🍼</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
            These moments won't wait
          </h2>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Every first bite, first step, and first giggle is a milestone. Start capturing them today.
          </p>
          {bundle && (
            <button
              onClick={() => handleBuy(bundle.slug)}
              disabled={loadingSlug !== null}
              className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loadingSlug === bundle.slug ? <Spinner /> : null}
              Get the Bundle — ${bundle.priceUsd.toFixed(2)}
            </button>
          )}
          <p className="text-sm mt-4" style={{ color: 'var(--color-muted)' }}>
            One-time purchase &middot; Instant delivery &middot; Works on any device
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              🦶
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>TinyToesAndUs</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            <button onClick={() => navigate('/claim')} className="hover:underline">Activate Code</button>
            <span>&copy; {new Date().getFullYear()} TinyToesAndUs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, loadingSlug, onBuy }: { product: Product; loadingSlug: string | null; onBuy: (slug: string) => void }) {
  const icon = PRODUCT_ICONS[product.slug] || '📦';
  const highlights = PRODUCT_HIGHLIGHTS[product.slug] || [];

  return (
    <div className="rounded-2xl p-6 flex flex-col transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>{product.name}</h3>
      <p className="text-sm mb-4 flex-1" style={{ color: 'var(--color-muted)' }}>{product.description}</p>
      <ul className="mb-5 space-y-1.5">
        {highlights.map(h => (
          <li key={h} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
            <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }}>✓</span>
            {h}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>${product.priceUsd.toFixed(2)}</span>
        <BuyButton product={product} loadingSlug={loadingSlug} onBuy={onBuy} />
      </div>
    </div>
  );
}

function BuyButton({ product, loadingSlug, onBuy }: { product: Product; loadingSlug: string | null; onBuy: (slug: string) => void }) {
  const isDisabled = loadingSlug !== null || !product.isAvailable;
  const isThisLoading = loadingSlug === product.slug;

  return (
    <button
      onClick={() => onBuy(product.slug)}
      disabled={isDisabled}
      className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {isThisLoading ? <Spinner /> : null}
      {product.isAvailable ? 'Buy Now' : 'Coming Soon'}
    </button>
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
