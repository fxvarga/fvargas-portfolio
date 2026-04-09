import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const FEATURES = [
  {
    icon: '📸',
    title: 'Photo Memories',
    description: 'Capture every first bite with beautiful photo entries that you\'ll treasure forever.',
  },
  {
    icon: '😍',
    title: 'Reaction Tracking',
    description: 'Record whether your little one loved it, was unsure, or said "no thanks" — every reaction is a memory.',
  },
  {
    icon: '📖',
    title: 'Memory Book',
    description: 'A gorgeous, printable memory book organized by month. Frame it, gift it, keep it forever.',
  },
  {
    icon: '🎨',
    title: 'Beautiful Themes',
    description: 'Choose from Neutral, Soft Pastel, or Playful — each one designed to match your style.',
  },
  {
    icon: '📱',
    title: 'Works Offline',
    description: 'Install on your phone like a real app. Works without internet — perfect for mealtime.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description: 'Your data stays on your device. No accounts, no cloud uploads, no tracking. Just you and baby.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I wish I had this when my first was starting solids. Now I have every single moment captured for baby #2.',
    author: 'Sarah M.',
    detail: 'Mom of two',
  },
  {
    quote: 'The memory book feature made me cry — in the best way. Printed it for the grandparents and they loved it.',
    author: 'Jessica R.',
    detail: 'First-time mom',
  },
  {
    quote: 'So simple to use. I can add an entry in 30 seconds between bites. And the themes are adorable.',
    author: 'Priya K.',
    detail: 'Mom of one',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, go to the app
  if (isAuthenticated) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleBuyNow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not start checkout.');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* ── Navigation ── */}
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
            <button
              onClick={handleBuyNow}
              disabled={isLoading}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--color-primary)' }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <span>✨</span>
              <span>A keepsake for every first bite</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" style={{ color: 'var(--color-text)' }}>
              Remember Every<br />
              <span style={{ color: 'var(--color-primary)' }}>First Bite</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--color-muted)' }}>
              The sweetest moments happen at mealtime. Capture your baby's food journey — every reaction, every photo, every memory — in a beautiful journal you'll cherish forever.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={handleBuyNow}
                disabled={isLoading}
                className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                Get Baby First Bites — $9.99
              </button>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                One-time purchase. No subscriptions.
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
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>6–9 months</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {['🥑 Avocado', '🍌 Banana', '🥕 Carrots', '🍠 Sweet Potato'].map((food, i) => (
                      <div key={food} className="rounded-xl p-3 text-center animate-fade-in" style={{ backgroundColor: 'var(--color-background)', animationDelay: `${i * 100}ms` }}>
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

      {/* ── Features ── */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              Everything you need to capture<br />the journey
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              Simple enough to use between bites. Beautiful enough to keep forever.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl transition-shadow hover:shadow-md"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
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
              { step: '1', title: 'Purchase', desc: 'Get Baby First Bites for a one-time $9.99. You\'ll receive your claim code by email.' },
              { step: '2', title: 'Activate', desc: 'Open the app, enter your email and claim code. Set up your baby\'s profile.' },
              { step: '3', title: 'Journal', desc: 'Start capturing every first bite — photos, reactions, notes. Build your memory book.' },
            ].map((item) => (
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

      {/* ── Testimonials ── */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              Parents love it
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
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

      {/* ── Final CTA ── */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🍼</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
            These moments won't wait
          </h2>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Every first bite is a milestone. Start capturing them today — before they're gone.
          </p>
          <button
            onClick={handleBuyNow}
            disabled={isLoading}
            className="inline-flex items-center justify-center font-bold text-lg px-10 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Get Baby First Bites — $9.99
          </button>
          <p className="text-sm mt-4" style={{ color: 'var(--color-muted)' }}>
            One-time purchase &middot; Instant delivery &middot; Works on any device
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
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
