import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Baby, Check, Smile, Meh, Camera, Clapperboard, Heart, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { api } from '@/lib/api';
import { getProductIcon, getProductHighlights } from '@/lib/products';
import { BrandMark } from '@/components/BrandMark';
import type { Product } from '@/types';

/* ── Nursery palette (used only on this page) ──────────── */
// Cream:      #FFF8F0   (bg)
// Warm white: #FFFFFF   (cards)
// Blush:      #E8A0BF   (primary accent)
// Blush light:#FDF2F8   (badge bg)
// Sage:       #8FB996   (secondary accent)
// Sage light: #F0F7F1   (secondary bg)
// Terracotta: #C4816B   (warm highlight)
// Text dark:  #3D2C2E   (headings)
// Text muted: #8B7E7F   (body)

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate('/year-recap', { replace: true });
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
    <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'rgba(255,248,240,0.9)', borderColor: '#F3E8DE' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <BrandMark size="md" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/claim')}
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{ color: '#3D2C2E' }}
              onMouseOver={e => (e.currentTarget.style.background = '#F3E8DE')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              I have a code
            </button>
            {bundle && (
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:shadow-md active:scale-[0.97]"
                style={{ background: '#E8A0BF' }}
              >
                View Products
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #E8A0BF 0%, #FFF8F0 70%)' }} />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#8FB996' }} />

        <div className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8" style={{ background: '#FDF2F8', color: '#C4816B' }}>
            <Sparkles size={16} />
            <span>A gentle place for precious memories</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" style={{ color: '#3D2C2E' }}>
            Every Little Moment<br />
            <span style={{ color: '#E8A0BF' }}>Deserves to Be</span><br />
            Remembered
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#8B7E7F' }}>
            The tiny yawns, the messy first bites, the wobbly first steps — they pass so quickly. 
            TinyToes helps you hold onto every tender moment of your baby's first year.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-full text-white shadow-lg transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #E8A0BF, #C4816B)' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(232,160,191,0.4)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)')}
            >
              Start Collecting Memories
            </button>
            <p className="text-sm" style={{ color: '#8B7E7F' }}>
              One-time purchase. No subscriptions. Your data stays yours.
            </p>
          </div>

          {/* Hero mock device */}
          <div className="relative max-w-xs mx-auto mt-4">
            <div className="rounded-3xl shadow-xl overflow-hidden border-4" style={{ background: '#FFFFFF', borderColor: '#F3E8DE' }}>
              <div className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FDF2F8' }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ color: '#E8A0BF' }}>
                      <ellipse cx="12" cy="16" rx="5" ry="7" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="8" cy="7" r="1.8" fill="currentColor" />
                      <circle cx="11" cy="5" r="1.8" fill="currentColor" />
                      <circle cx="14.5" cy="5.5" r="1.6" fill="currentColor" />
                      <circle cx="17" cy="7.5" r="1.4" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#3D2C2E' }}>Emma's Journal</div>
                    <div className="text-xs" style={{ color: '#8B7E7F' }}>6-9 months</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { name: 'Avocado', loved: true },
                    { name: 'Banana', loved: true },
                    { name: 'Carrots', loved: false },
                    { name: 'Sweet Potato', loved: true },
                  ].map(food => (
                    <div key={food.name} className="rounded-xl p-3 text-center" style={{ background: '#FFF8F0' }}>
                      <div className="flex justify-center mb-1">
                        {food.loved
                          ? <Smile size={24} style={{ color: '#E8A0BF' }} />
                          : <Meh size={24} style={{ color: '#8B7E7F' }} />}
                      </div>
                      <div className="text-xs font-medium" style={{ color: '#3D2C2E' }}>{food.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs px-1" style={{ color: '#8B7E7F' }}>
                  <span>4 foods tried</span>
                  <span>3 loved!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-8 border-y" style={{ background: '#FFFFFF', borderColor: '#F3E8DE' }}>
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {[
            { icon: Shield, text: 'Private & secure' },
            { icon: Smartphone, text: 'Works on any device' },
            { icon: Heart, text: 'Made with love' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-2">
              <b.icon size={18} style={{ color: '#8FB996' }} />
              <span className="text-sm font-medium" style={{ color: '#3D2C2E' }}>{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Product Catalog */}
      <section id="products" className="py-20" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#3D2C2E' }}>
              Tools Made for Your Family
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#8B7E7F' }}>
              Choose just what you need, or save with the bundle. Every product is a one-time purchase — no subscriptions, ever.
            </p>
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-8 w-8" style={{ color: '#E8A0BF' }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {/* Bundle CTA */}
              {bundle && (
                <div className="mb-10 rounded-3xl p-6 sm:p-8 border-2 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #FDF2F8, #FFF8F0)', borderColor: '#E8A0BF' }}
                >
                  <div className="absolute top-0 right-0 px-5 py-1.5 rounded-bl-2xl text-xs font-bold text-white" style={{ background: '#C4816B' }}>
                    BEST VALUE
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {(() => {
                          const BundleIcon = getProductIcon(bundle.slug);
                          return <BundleIcon size={32} style={{ color: '#E8A0BF' }} />;
                        })()}
                        <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#3D2C2E' }}>{bundle.name}</h3>
                      </div>
                      <p className="text-sm mb-3" style={{ color: '#8B7E7F' }}>{bundle.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(bundle.bundleIncludes?.split(',') || []).map(slug => {
                          const p = standaloneProducts.find(sp => sp.slug === slug);
                          const SlugIcon = getProductIcon(slug);
                          return p ? (
                            <span key={slug} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#FDF2F8', color: '#E8A0BF' }}>
                              <SlugIcon size={12} /> {p.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="text-sm line-through mb-1" style={{ color: '#8B7E7F' }}>
                        ${totalIndividual.toFixed(2)}
                      </div>
                      <div className="text-3xl font-extrabold mb-1" style={{ color: '#C4816B' }}>
                        ${bundle.priceUsd.toFixed(2)}
                      </div>
                      <div className="text-xs font-semibold mb-3" style={{ color: '#8FB996' }}>
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

              {/* Free features callout */}
              <div className="mt-10 rounded-3xl p-6 sm:p-8 text-center border" style={{ background: '#F0F7F1', borderColor: '#D4E8D7' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#3D2C2E' }}>
                  Included free with any purchase
                </h3>
                <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: '#8B7E7F' }}>
                  Because every parent deserves these, no matter which tools they choose.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Camera size={20} style={{ color: '#8FB996' }} />
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: '#3D2C2E' }}>Memory Book</div>
                      <div className="text-xs" style={{ color: '#8B7E7F' }}>A printable keepsake of every moment</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clapperboard size={20} style={{ color: '#8FB996' }} />
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: '#3D2C2E' }}>Year Recap</div>
                      <div className="text-xs" style={{ color: '#8B7E7F' }}>A beautiful summary of your year together</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ background: '#FFF8F0' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#3D2C2E' }}>
              Simple as a lullaby
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#8B7E7F' }}>
              No app store. No complicated setup. Just a code and you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Choose', desc: 'Pick the tools that feel right for your family. You\'ll get a personal claim code by email.' },
              { step: '2', title: 'Activate', desc: 'Open TinyToes, enter your email and code. It only takes a moment — like your little one\'s nap.' },
              { step: '3', title: 'Cherish', desc: 'Start capturing those fleeting firsts. Everything stays private on your device, always.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #E8A0BF, #C4816B)' }}>
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#3D2C2E' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8B7E7F' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#3D2C2E' }}>
              From parents who get it
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#8B7E7F' }}>
              Real families, real memories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { quote: 'I wish I had this when my first was starting solids. Now I have every little moment captured for baby #2. It feels like a gift to my future self.', author: 'Sarah M.', detail: 'Mom of two' },
              { quote: 'The memory book made me cry — in the best way. I printed it for the grandparents and they couldn\'t stop smiling. These moments are so worth saving.', author: 'Jessica R.', detail: 'First-time mom' },
              { quote: 'So gentle and easy to use. I add entries in 30 seconds while she\'s in the high chair. It just fits into our life perfectly.', author: 'Priya K.', detail: 'Mom of one' },
            ].map(t => (
              <div key={t.author} className="p-6 rounded-3xl border" style={{ background: '#FFF8F0', borderColor: '#F3E8DE' }}>
                <div className="mb-3">
                  <Heart size={16} style={{ color: '#E8A0BF' }} fill="#E8A0BF" />
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#3D2C2E' }}>"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#3D2C2E' }}>{t.author}</p>
                  <p className="text-xs" style={{ color: '#8B7E7F' }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FDF2F8 0%, #FFF8F0 100%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#E8A0BF' }} />
        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <div className="flex justify-center mb-6">
            <Baby size={48} style={{ color: '#E8A0BF' }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#3D2C2E' }}>
            They won't be this little forever
          </h2>
          <p className="text-lg mb-8 max-w-md mx-auto leading-relaxed" style={{ color: '#8B7E7F' }}>
            Every tiny yawn, wobbly step, and messy giggle is a once-in-a-lifetime moment. 
            Hold onto them gently, before they grow.
          </p>
          {bundle && (
            <button
              onClick={() => handleBuy(bundle.slug)}
              disabled={loadingSlug !== null}
              className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-full text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E8A0BF, #C4816B)' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(232,160,191,0.4)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)')}
            >
              {loadingSlug === bundle.slug ? <Spinner /> : null}
              Get the Bundle — ${bundle.priceUsd.toFixed(2)}
            </button>
          )}
          <p className="text-sm mt-4" style={{ color: '#8B7E7F' }}>
            One-time purchase &middot; Instant delivery &middot; Works on any device
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ background: '#FFF8F0', borderColor: '#F3E8DE' }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandMark size="sm" />
          <div className="flex items-center gap-6 text-sm" style={{ color: '#8B7E7F' }}>
            <button onClick={() => navigate('/claim')} className="hover:underline">Activate Code</button>
            <span>&copy; {new Date().getFullYear()} TinyToesAndUs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, loadingSlug, onBuy }: { product: Product; loadingSlug: string | null; onBuy: (slug: string) => void }) {
  const Icon = getProductIcon(product.slug);
  const highlights = getProductHighlights(product.slug);

  return (
    <div className="rounded-3xl p-6 flex flex-col transition-all hover:shadow-lg border" style={{ background: '#FFFFFF', borderColor: '#F3E8DE' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FDF2F8' }}>
        <Icon size={24} style={{ color: '#E8A0BF' }} />
      </div>
      <h3 className="font-bold text-lg mb-1" style={{ color: '#3D2C2E' }}>{product.name}</h3>
      <p className="text-sm mb-4 flex-1" style={{ color: '#8B7E7F' }}>{product.description}</p>
      <ul className="mb-5 space-y-1.5">
        {highlights.map(h => (
          <li key={h} className="flex items-start gap-2 text-xs" style={{ color: '#3D2C2E' }}>
            <span className="mt-0.5 shrink-0" style={{ color: '#8FB996' }}><Check size={12} /></span>
            {h}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-extrabold" style={{ color: '#3D2C2E' }}>${product.priceUsd.toFixed(2)}</span>
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
      className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-full text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      style={{ background: '#E8A0BF' }}
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
