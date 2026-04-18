import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label: string;
}

export function FAB({ onClick, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fab-button fixed bottom-22 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all active:scale-90 z-40 no-print bg-theme-primary"
      style={{
        boxShadow: '0 4px 16px rgba(61,44,46,0.12), 0 1px 4px rgba(61,44,46,0.08)',
      }}
      aria-label={label}
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
