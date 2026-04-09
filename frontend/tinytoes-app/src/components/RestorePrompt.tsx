import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { importData } from '@/lib/exportImport';
import { entriesDb, profileDb } from '@/lib/db';

const DISMISS_KEY = 'tinytoes-restore-dismissed';

interface RestorePromptProps {
  /** Called after successful restore so parent can reload data */
  onRestored: () => void;
}

export function RestorePrompt({ onRestored }: RestorePromptProps) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Only show in standalone mode (PWA from home screen)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator &&
          (window.navigator as unknown as { standalone: boolean }).standalone);

      if (!isStandalone) return;

      // Already dismissed?
      if (localStorage.getItem(DISMISS_KEY)) return;

      // Check if IDB is empty (no entries AND no completed profile)
      const [entries, profile] = await Promise.all([
        entriesDb.getAll(),
        profileDb.get(),
      ]);

      if (cancelled) return;

      const hasData = entries.length > 0 || (profile && profile.onboardingComplete);
      if (!hasData) {
        setShow(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setShow(false);
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setMessage('');

    try {
      const result = await importData(file);
      setStatus('success');
      setMessage(
        `Restored ${result.entryCount} ${result.entryCount === 1 ? 'entry' : 'entries'} for ${result.profile.name}.`
      );
      // Brief delay so user sees the success message
      setTimeout(() => {
        onRestored();
        setShow(false);
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to restore backup.');
      // Reset file input so user can try again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onRestored]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative mx-4 w-full max-w-sm rounded-3xl shadow-xl animate-slide-up p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-panel)' }}
      >
        {/* Icon */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Welcome back!
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            It looks like your journal data isn't here yet. If you exported a backup before, you can restore it now.
          </p>
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <div
            className="rounded-xl p-3 text-center text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-xl p-3 text-center text-sm font-medium bg-red-50 text-red-600">
            {message}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Actions */}
        {status !== 'success' && (
          <div className="space-y-3">
            <Button
              fullWidth
              loading={status === 'loading'}
              onClick={() => fileInputRef.current?.click()}
            >
              Restore from Backup
            </Button>
            <Button
              fullWidth
              variant="ghost"
              disabled={status === 'loading'}
              onClick={dismiss}
            >
              Start Fresh
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
