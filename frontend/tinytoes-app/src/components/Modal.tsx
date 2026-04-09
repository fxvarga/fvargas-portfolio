import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl animate-slide-up"
        style={{ backgroundColor: 'var(--color-panel)' }}
      >
        <div className="sticky top-0 flex items-center justify-between p-5 pb-0" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 sm:hidden mb-3" />
        </div>
        {title && (
          <div className="px-5 pt-2 pb-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
