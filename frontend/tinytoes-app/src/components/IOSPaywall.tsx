import { useState } from 'react';
import { isNativeApp } from '@/lib/storage-adapter';
import { api } from '@/lib/api';
import { Lock, ShoppingBag, RotateCcw, KeyRound } from 'lucide-react';

interface IOSPaywallProps {
  /** Called after a successful purchase or restore to refresh entitlements */
  onUnlocked: () => void;
  /** Switch to the "enter website code" flow */
  onEnterCode: () => void;
  /** Number of free images remaining in trial */
  trialRemaining: number;
  /** Total trial limit */
  trialLimit: number;
}

export function IOSPaywall({ onUnlocked, onEnterCode, trialRemaining, trialLimit }: IOSPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('$9.99');

  // Get price from StoreKit on mount
  useState(() => {
    if (isNativeApp() && window.nativeIAP) {
      window.nativeIAP.getStatus().then((status) => {
        if (status.price) setPrice(status.price);
      });
    }
  });

  const handlePurchase = async () => {
    if (!window.nativeIAP) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.nativeIAP.purchase();
      if (result.purchased && result.transactionId) {
        // Verify with our server
        await api.verifyApple(result.transactionId);
        onUnlocked();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.nativeIAP) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.nativeIAP.restore();
      if (result.purchased && result.transactionId) {
        await api.verifyApple(result.transactionId);
        onUnlocked();
      } else {
        setError('No previous purchase found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-xl"
        style={{ backgroundColor: 'var(--color-surface, #fff)' }}
      >
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
            onClick={onEnterCode}
            disabled={isLoading}
            className="flex items-center gap-1 disabled:opacity-50"
            style={{ color: 'var(--color-primary, #f59e0b)' }}
          >
            <KeyRound size={14} />
            I have a code
          </button>
        </div>
      </div>
    </div>
  );
}
