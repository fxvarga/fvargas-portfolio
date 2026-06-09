import { useEffect, useState } from 'react';
import { isNativeApp } from '@/lib/storage-adapter';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { Lock, ShoppingBag, RotateCcw, KeyRound, X, ChevronLeft } from 'lucide-react';
import { CORE_PRODUCT_SLUGS } from '@/types';

const ENTITLEMENTS_CACHE_KEY = 'tinytoes-entitlements';

function grantLocalAppleEntitlement() {
  localStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify(CORE_PRODUCT_SLUGS));
}

interface IOSPaywallProps {
  /** Called after a successful purchase or restore to refresh entitlements */
  onUnlocked: () => void;
  /** Close the paywall without purchasing */
  onClose: () => void;
  /** Number of free images remaining in trial */
  trialRemaining: number;
  /** Total trial limit */
  trialLimit: number;
}

export function IOSPaywall({ onUnlocked, onClose, trialRemaining, trialLimit }: IOSPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('$9.99');
  const [view, setView] = useState<'main' | 'code'>('main');

  // Code entry state
  const { claim, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  // Get price/product availability from StoreKit on mount.
  useEffect(() => {
    if (isNativeApp() && window.nativeIAP) {
      window.nativeIAP.getStatus().then((status) => {
        if (status.price) setPrice(status.price);
        if (status.productAvailable === false) {
          setError(
            status.error ||
              'In-app purchase is not available. Check App Store Connect product setup.'
          );
        }
      }).catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load in-app purchase.');
      });
    }
  }, []);

  const handlePurchase = async () => {
    if (!window.nativeIAP) return;

    setIsLoading(true);
    setError(null);
    analytics.event('iap_purchase_started', { product_id: 'com.tinytoes.app.firstyearbundle', source: 'ios_paywall' });

    try {
      const result = await window.nativeIAP.purchase();
      if (result.purchased && result.transactionId) {
        grantLocalAppleEntitlement();
        if (isAuthenticated) {
          try {
            await api.verifyApple(result.transactionId);
          } catch {
            // Local StoreKit entitlement is enough to unlock native modules;
            // server verification sync can be retried later via restore.
          }
        }
        analytics.event('iap_purchase_completed', { product_id: 'com.tinytoes.app.firstyearbundle', products_granted: CORE_PRODUCT_SLUGS.length });
        onUnlocked();
      } else {
        setError('Purchase was not completed. If no App Store sheet appeared, check the product in App Store Connect.');
      }
    } catch (err) {
      analytics.error(err, { area: 'iap_purchase' });
      setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.nativeIAP) return;

    setIsLoading(true);
    setError(null);
    analytics.event('iap_restore_started', { source: 'ios_paywall' });

    try {
      const result = await window.nativeIAP.restore();
      if (result.purchased && result.transactionId) {
        grantLocalAppleEntitlement();
        if (isAuthenticated) {
          try {
            await api.verifyApple(result.transactionId);
          } catch {
            // Do not block native restore on backend sync failure.
          }
        }
        analytics.event('iap_restore_completed', { products_restored: CORE_PRODUCT_SLUGS.length });
        onUnlocked();
      } else {
        setError('No previous purchase found.');
      }
    } catch (err) {
      analytics.error(err, { area: 'iap_restore' });
      setError(err instanceof Error ? err.message : 'Restore failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCode = (val: string) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const parts: string[] = [];
    if (clean.length > 0) parts.push(clean.slice(0, 4));
    if (clean.length > 4) parts.push(clean.slice(4, 8));
    if (clean.length > 8) parts.push(clean.slice(8, 12));
    return parts.join('-');
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);

    if (!email.trim()) {
      setCodeError('Please enter your email address.');
      return;
    }
    if (!code.trim()) {
      setCodeError('Please enter your claim code.');
      return;
    }

    setCodeSubmitting(true);
    try {
      await claim(email.trim(), code.trim().toUpperCase());
      analytics.event('gift_code_redeemed', { is_authenticated: isAuthenticated, source: 'ios_paywall' });
      setCodeSuccess('Product activated!');
      setTimeout(() => onUnlocked(), 1000);
    } catch {
      setCodeError('Activation failed. Please check your code and try again.');
    } finally {
      setCodeSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-xl relative"
        style={{ backgroundColor: 'var(--color-surface, #fff)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label="Close"
        >
          <X size={18} style={{ color: 'var(--color-muted, #6b7280)' }} />
        </button>

        {view === 'main' ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-light, #fef3c7)' }}
              >
                <Lock size={28} style={{ color: 'var(--color-primary, #f59e0b)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text, #1f2937)' }}>
                Unlock Tiny Toes
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-muted, #6b7280)' }}>
                {trialRemaining > 0
                  ? `You have ${trialRemaining} of ${trialLimit} free images remaining.`
                  : "You've used all your free trial images."}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-text, #374151)' }}>
              <div className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span> Unlimited First Foods tracking
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span> Milestones tracker
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span> Monthly Journal
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span> Memory Book & Year Recap
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Purchase button */}
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #f59e0b)' }}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Unlock for {price}
                </>
              )}
            </button>

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={handleRestore}
                disabled={isLoading}
                className="flex items-center gap-1 disabled:opacity-50"
                style={{ color: 'var(--color-primary, #f59e0b)' }}
              >
                <RotateCcw size={14} />
                Restore Purchase
              </button>
              <span style={{ color: 'var(--color-muted, #d1d5db)' }}>|</span>
              <button
                onClick={() => { setView('code'); setError(null); }}
                disabled={isLoading}
                className="flex items-center gap-1 disabled:opacity-50"
                style={{ color: 'var(--color-primary, #f59e0b)' }}
              >
                <KeyRound size={14} />
                I have a code
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Code entry view */}
            <div>
              <button
                onClick={() => { setView('main'); setCodeError(null); setCodeSuccess(null); }}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--color-primary, #f59e0b)' }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            </div>

            <div className="text-center space-y-2">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-light, #fef3c7)' }}
              >
                <KeyRound size={28} style={{ color: 'var(--color-primary, #f59e0b)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text, #1f2937)' }}>
                Enter Your Code
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-muted, #6b7280)' }}>
                Enter your email and claim code from your website purchase.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text, #374151)' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--color-border, #e5e7eb)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-text, #1f2937)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text, #374151)' }}>
                  Claim Code
                </label>
                <input
                  placeholder="TINY-XXXX-XXXX"
                  value={code}
                  onChange={e => setCode(formatCode(e.target.value))}
                  maxLength={14}
                  autoComplete="off"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    borderColor: 'var(--color-border, #e5e7eb)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-text, #1f2937)',
                  }}
                />
              </div>

              {codeError && (
                <p className="text-sm text-red-500 text-center">{codeError}</p>
              )}
              {codeSuccess && (
                <p className="text-sm text-center font-medium" style={{ color: 'var(--color-primary, #f59e0b)' }}>
                  {codeSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={codeSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary, #f59e0b)' }}
              >
                {codeSubmitting ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Activate'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
