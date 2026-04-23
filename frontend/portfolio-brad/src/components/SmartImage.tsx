import { useState } from 'react';
import { useImageMode } from '../context/ImageModeContext';
import { imagePathToStock } from '../content/stockImages';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  placeholderLabel?: string;
}

/**
 * Image component that respects the global image mode toggle.
 *
 * - "stock" mode: tries local image first, falls back to curated stock photo
 * - "placeholder" mode: shows a styled placeholder with label text
 *
 * When Brad provides real images, they'll load from the local path;
 * the stock URL is only used as a fallback when the local file is missing.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  placeholderLabel,
}: SmartImageProps) {
  const { mode } = useImageMode();
  const [localFailed, setLocalFailed] = useState(false);
  const [stockFailed, setStockFailed] = useState(false);

  const stockUrl = imagePathToStock[src];
  const label = placeholderLabel || alt;

  // Placeholder mode
  if (mode === 'placeholder') {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-xs text-slate-500 font-body max-w-[200px]">{label}</p>
        </div>
      </div>
    );
  }

  // Stock mode — try local file first
  if (!localFailed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={() => setLocalFailed(true)}
      />
    );
  }

  // Local failed — try stock image
  if (stockUrl && !stockFailed) {
    return (
      <img
        src={stockUrl}
        alt={alt}
        className={className}
        loading={loading}
        onError={() => setStockFailed(true)}
      />
    );
  }

  // Both failed — gradient fallback
  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-emerald-600/20 to-slate-800/30 flex items-center justify-center p-4 ${className}`}
      role="img"
      aria-label={alt}
    >
      <p className="text-sm text-center text-slate-500 font-body">{label}</p>
    </div>
  );
}
