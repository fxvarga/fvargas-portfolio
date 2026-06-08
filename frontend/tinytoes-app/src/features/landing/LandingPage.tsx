import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Clapperboard,
  LockKeyhole,
  Sparkles,
  Star,
  Trophy,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { api } from '@/lib/api';
import { BrandMark } from '@/components/BrandMark';
import type { Product } from '@/types';

const screenshots = {
  onboarding: '/marketing/onboarding-empty.png',
  dashboard: '/marketing/iphone-recap-dashboard.png',
  foods: '/marketing/iphone-foods-list.png',
  gallery: '/marketing/iphone-gallery-carrots.png',
  milestones: '/marketing/iphone-milestones.png',
  journal: '/marketing/iphone-journal.png',
  book: '/marketing/iphone-memory-book.png',
};

const features = [
  {
    icon: UtensilsCrossed,
    title: 'First foods & reactions',
    copy: 'Photos, notes, dates, and those tiny “loved it” moments all in one place.',
    image: screenshots.foods,
  },
  {
    icon: Trophy,
    title: 'Milestones without pressure',
    copy: 'Capture what mattered, whenever it happened — not because an age chart said so.',
    image: screenshots.milestones,
  },
  {
    icon: BookOpen,
    title: 'Monthly reflections',
    copy: 'Turn scattered memories into a gentle timeline of personality, growth, and everyday magic.',
    image: screenshots.journal,
  },
];

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
    <div className="min-h-screen overflow-hidden bg-[#fffaf3] text-[#3D2C2E]">
      <nav className="sticky top-0 z-50 border-b border-[#F5EDF1]/80 bg-[#fffaf3]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <BrandMark size="md" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/claim')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#8B7E7F] transition hover:bg-[#FDF0F5]"
            >
              Activate code
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden rounded-full bg-[#8FB996] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Get TinyToes
            </button>
          </div>
        </div>
      </nav>

      <section className="relative px-5 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="absolute left-1/2 top-8 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#FDF0F5]/45 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[26rem] w-[26rem] rounded-full bg-[#EDF5EF]/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F5EDF1] bg-white/70 px-4 py-2 text-sm font-semibold text-[#C56F7B] shadow-sm">
              <Sparkles size={16} />
              A keepsake app for every stage of childhood
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-[#3D2C2E] sm:text-7xl lg:text-8xl">
              Save the little things before they become the big things.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#8B7E7F] sm:text-xl">
              TinyToes turns meals, milestones, photos, journal notes, and printable memory books into one private family timeline — usable at any age, not boxed into one baby stage.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8FB996] px-7 py-4 text-base font-black text-white shadow-xl shadow-[#8FB996]/20 transition hover:-translate-y-0.5"
              >
                Start your memory suite <ArrowRight size={18} />
              </button>
              <button
                onClick={() => document.getElementById('tour')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center rounded-full border border-[#EDE8E3] bg-white/80 px-7 py-4 text-base font-bold text-[#3D2C2E] shadow-sm transition hover:-translate-y-0.5"
              >
                See the app
              </button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-[#8B7E7F]">
              {['Private by default', 'Works on iPhone + web', 'Print-ready keepsakes'].map(text => (
                <div key={text} className="rounded-2xl border border-[#EDE8E3] bg-white/70 p-3 font-semibold">
                  <Check size={16} className="mb-1 text-[#55A887]" /> {text}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[25rem]">
            <PhoneFrame src={screenshots.dashboard} alt="TinyToes recap dashboard" className="rotate-[2deg]" />
            <div className="absolute -bottom-7 -left-7 w-40 rotate-[-9deg] rounded-[2rem] border border-white bg-white p-2 shadow-2xl sm:w-48">
              <img src={screenshots.gallery} alt="Carrots detail in TinyToes" className="rounded-[1.45rem]" />
            </div>
          </div>
        </div>
      </section>

      <section id="tour" className="bg-[#8FB996] px-5 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-[#FFF5E6]">Product tour</p>
              <h2 className="max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                Real memories, not fake app mockups.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#FFF8F0]">
              These screens are captured from an actual family backup, showing the app exactly as it feels with lived-in memories.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <FeaturePanel image={screenshots.foods} title="Track every bite" copy="Reactions, dates, photos, and notes stay beautifully organized." />
            <FeaturePanel image={screenshots.gallery} title="Open a full memory" copy="Tap into the story behind each photo with a clean gallery-style detail view." compact />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {features.map(feature => (
              <div key={feature.title} className="rounded-[2rem] bg-white/8 p-4 ring-1 ring-white/10">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#FFF5E6]">
                  <feature.icon size={18} /> {feature.title}
                </div>
                <p className="mb-4 text-sm leading-6 text-[#FFF8F0]">{feature.copy}</p>
                <PhoneFrame src={feature.image} alt={feature.title} small />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#C4816B]">From app to heirloom</p>
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              Build the book while life is happening.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#8B7E7F]">
              Every photo, note, food adventure, monthly reflection, and milestone can become a printable memory book — no scrambling through camera rolls later.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ['Memory books', 'Turn saved moments into a physical keepsake.'],
                ['Year recap', 'See your family story across time.'],
                ['Import/export', 'Your data stays portable.'],
                ['Private archive', 'Built for family memories first.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-3xl border border-[#EDE8E3] bg-white p-4 shadow-sm">
                  <Star size={17} className="mb-2 fill-[#d59c6b] text-[#d59c6b]" />
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#8B7E7F]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PhoneFrame src={screenshots.book} alt="Memory book print screen" small />
            <PhoneFrame src={screenshots.onboarding} alt="TinyToes onboarding" small className="mt-10" />
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#55A887]">Choose your suite</p>
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">Capture more than photos.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#8B7E7F]">
              Start with the whole memory suite or activate an existing code. iOS purchases use Apple In-App Purchase.
            </p>
          </div>

          {productsLoading ? (
            <div className="py-12 text-center font-semibold text-[#8B7E7F]">Loading products…</div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              {bundle && (
                <div className="relative overflow-hidden rounded-[2.25rem] bg-[#8FB996] p-7 text-white shadow-2xl">
                  <div className="absolute right-5 top-5 rounded-full bg-[#f4cbb9] px-3 py-1 text-xs font-black text-[#3D2C2E]">
                    Best value
                  </div>
                  <Clapperboard size={34} className="mb-5 text-[#FFF5E6]" />
                  <h3 className="text-3xl font-black">{bundle.name}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-[#FFF8F0]">{bundle.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {(bundle.bundleIncludes?.split(',') || []).map(slug => (
                      <span key={slug} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#FFF8F0]">
                        {slug.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-sm text-[#FFF5E6] line-through">${totalIndividual.toFixed(2)}</div>
                      <div className="text-5xl font-black">${bundle.priceUsd.toFixed(2)}</div>
                      <div className="text-sm font-bold text-[#FFF5E6]">Save ${savings.toFixed(2)}</div>
                    </div>
                    <BuyButton product={bundle} loadingSlug={loadingSlug} onBuy={handleBuy} dark />
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {standaloneProducts.map(product => (
                  <ProductRow key={product.slug} product={product} loadingSlug={loadingSlug} onBuy={handleBuy} />
                ))}
                <button
                  onClick={() => navigate('/claim')}
                  className="rounded-3xl border border-dashed border-[#EDE8E3] bg-[#fffaf3] p-5 text-left transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="text-[#C4816B]" />
                    <div>
                      <h3 className="font-black">Already purchased?</h3>
                      <p className="text-sm text-[#8B7E7F]">Activate your claim code to unlock modules.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#EDE8E3] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <BrandMark size="sm" />
          <p className="text-sm font-semibold text-[#8B7E7F]">© {new Date().getFullYear()} TinyToesAndUs. Built for the moments you never want to lose.</p>
        </div>
      </footer>
    </div>
  );
}

function PhoneFrame({ src, alt, small = false, className = '' }: { src: string; alt: string; small?: boolean; className?: string }) {
  return (
    <div className={`${small ? 'rounded-[2.2rem] p-2' : 'rounded-[2.8rem] p-3'} border border-[#e9d8c7] bg-[#FDF0F5] shadow-2xl ${className}`}>
      <div className="overflow-hidden rounded-[2rem] bg-white">
        <img src={src} alt={alt} className="block w-full" />
      </div>
    </div>
  );
}

function FeaturePanel({ image, title, copy, compact = false }: { image: string; title: string; copy: string; compact?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[2.25rem] bg-white text-[#3D2C2E] shadow-2xl ${compact ? '' : 'lg:grid lg:grid-cols-[0.78fr_1fr]'}`}>
      <div className="p-6 sm:p-8">
        <Camera className="mb-5 text-[#C4816B]" size={30} />
        <h3 className="text-3xl font-black tracking-[-0.04em]">{title}</h3>
        <p className="mt-3 text-base leading-7 text-[#8B7E7F]">{copy}</p>
      </div>
      <div className="flex items-center justify-center bg-[#FFF8F0] p-5 sm:p-8">
        <div className="w-full max-w-[17rem]">
          <PhoneFrame src={image} alt={title} small />
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, loadingSlug, onBuy }: { product: Product; loadingSlug: string | null; onBuy: (slug: string) => void }) {
  return (
    <div className="rounded-[1.75rem] border border-[#EDE8E3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black">{product.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[#8B7E7F]">{product.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black">${product.priceUsd.toFixed(2)}</div>
          <BuyButton product={product} loadingSlug={loadingSlug} onBuy={onBuy} />
        </div>
      </div>
    </div>
  );
}

function BuyButton({ product, loadingSlug, onBuy, dark = false }: { product: Product; loadingSlug: string | null; onBuy: (slug: string) => void; dark?: boolean }) {
  const isDisabled = loadingSlug !== null || !product.isAvailable;
  return (
    <button
      onClick={() => onBuy(product.slug)}
      disabled={isDisabled}
      className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition active:scale-[0.98] disabled:opacity-50 ${
        dark ? 'bg-white text-[#8FB996]' : 'bg-[#8FB996] text-white'
      }`}
    >
      {loadingSlug === product.slug ? 'Loading…' : product.isAvailable ? 'Buy now' : 'Coming soon'}
    </button>
  );
}
