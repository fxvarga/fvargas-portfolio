import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max height as vh unit (default 55) */
  maxHeight?: number;
}

/**
 * A slide-up bottom sheet for mobile. Renders over the current page.
 */
export function BottomSheet({ isOpen, onClose, title, children, maxHeight = 55 }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up flex flex-col"
        style={{ maxHeight: `${maxHeight}vh` }}
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-100">
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto" />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {title && (
          <p className="px-4 py-1 text-xs font-bold text-gray-800 uppercase tracking-wide shrink-0">{title}</p>
        )}

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </>
  );
}
