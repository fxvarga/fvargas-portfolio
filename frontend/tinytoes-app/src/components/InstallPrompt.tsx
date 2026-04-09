import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { exportData } from '@/lib/exportImport';

interface InstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallPrompt({ isOpen, onClose }: InstallPromptProps) {
  const { isIOS, isInstalled, canPrompt, promptInstall } = useInstallPrompt();
  const [backedUp, setBackedUp] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      setBackedUp(true);
    } finally {
      setExporting(false);
    }
  };

  if (isInstalled) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Install App">
        <div className="text-center py-6">
          <div className="text-4xl mb-3">&#10003;</div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Already Installed</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            TinyToes is installed on your device.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Home Screen">
      <div className="space-y-5">
        {/* Backup warning — shown before install steps */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                Back up your data first!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                The home screen app uses separate storage. Export a backup now so you can restore your entries after installing.
              </p>
            </div>
          </div>
          {backedUp ? (
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Backup downloaded!
            </div>
          ) : (
            <Button
              size="sm"
              fullWidth
              loading={exporting}
              onClick={handleExport}
            >
              Export Backup Now
            </Button>
          )}
        </div>

        {/* Install steps */}
        {isIOS ? (
          <>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Install TinyToes to your home screen for the best experience:
            </p>
            <div className="space-y-4">
              <Step number={1} text='Tap the Share button in Safari' icon="share" />
              <Step number={2} text='Scroll down and tap "Add to Home Screen"' icon="plus" />
              <Step number={3} text='Tap "Add" in the top right' icon="check" />
            </div>
          </>
        ) : canPrompt ? (
          <>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Install TinyToes for quick access from your home screen.
            </p>
            <Button fullWidth onClick={async () => { await promptInstall(); onClose(); }}>
              Install App
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Install TinyToes to your home screen for the best experience:
            </p>
            <div className="space-y-4">
              <Step number={1} text='Tap the menu icon (three dots) in your browser' icon="menu" />
              <Step number={2} text='Tap "Add to Home Screen" or "Install App"' icon="plus" />
              <Step number={3} text='Confirm the installation' icon="check" />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Step({ number, text, icon }: { number: number; text: string; icon: string }) {
  const icons: Record<string, string> = {
    share: '\u{F04B}',
    plus: '+',
    check: '\u2713',
    menu: '\u22EE',
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
      >
        {number}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {text}
        </p>
        <div
          className="mt-2 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-muted)' }}
        >
          {icons[icon]}
        </div>
      </div>
    </div>
  );
}
