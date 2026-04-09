import { REACTIONS, type Reaction } from '@/types';

interface ReactionPickerProps {
  value: Reaction | null;
  onChange: (reaction: Reaction) => void;
}

export function ReactionPicker({ value, onChange }: ReactionPickerProps) {
  return (
    <div className="flex gap-3">
      {REACTIONS.map(({ emoji, label }) => {
        const isSelected = value === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${isSelected ? 'shadow-sm' : ''}`}
            style={{
              borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-accent)',
              backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
            }}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-muted)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
