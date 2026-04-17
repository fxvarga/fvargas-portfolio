import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label: string;
}

export function FAB({ onClick, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fab-button fixed bottom-22 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-90 z-40 no-print bg-theme-primary"
      aria-label={label}
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
