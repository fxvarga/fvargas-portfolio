import { Smile, Meh, Frown } from 'lucide-react';
import { REACTIONS, type Reaction } from '@/types';

const REACTION_ICONS = { loved: Smile, neutral: Meh, disliked: Frown } as const;

interface ReactionPickerProps {
  value: Reaction | null;
  onChange: (reaction: Reaction) => void;
}

export function ReactionPicker({ value, onChange }: ReactionPickerProps) {
  return (
    <div className="flex gap-3">
      {REACTIONS.map(({ key, label }) => {
        const isSelected = value === key;
        const Icon = REACTION_ICONS[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
              isSelected
                ? 'border-theme-primary bg-theme-primary-light shadow-sm'
                : 'border-theme-accent bg-transparent'
            }`}
          >
            <Icon size={24} />
            <span className={`text-xs font-medium ${isSelected ? 'text-theme-primary' : 'text-theme-muted'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
