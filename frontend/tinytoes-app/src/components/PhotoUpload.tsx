import { useState, useRef } from 'react';
import { compressImage } from '@/lib/imageUtils';

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  circular?: boolean;
  label?: string;
}

export function PhotoUpload({ value, onChange, circular = false, label }: PhotoUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsCompressing(true);

    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image.');
    } finally {
      setIsCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const shape = circular
    ? 'w-32 h-32 rounded-full'
    : 'w-full aspect-[4/3] rounded-2xl';

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${shape} border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-200 hover:border-[var(--color-primary)]`}
        style={{ borderColor: value ? 'transparent' : 'var(--color-accent)', backgroundColor: 'var(--color-accent)' }}
      >
        {isCompressing ? (
          <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-muted)' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : value ? (
          <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--color-muted)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs font-medium">Tap to add photo</span>
          </div>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--color-muted)' }}
        >
          Remove photo
        </button>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}
