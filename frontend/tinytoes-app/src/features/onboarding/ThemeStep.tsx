import { Button } from '@/components/Button';
import { themes } from '@/lib/themes';
import type { ThemeName } from '@/types';

interface ThemeStepProps {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
  onNext: () => void;
  onBack: () => void;
}

const THEME_NAMES: ThemeName[] = ['Neutral', 'Soft Pastel', 'Playful'];

export function ThemeStep({ value, onChange, onNext, onBack }: ThemeStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold font-display tracking-tight text-center mb-2 text-theme-text">
          Choose a theme
        </h2>
        <p className="text-sm text-center mb-8 text-theme-muted">
          Set the mood for your journal.
        </p>

        <div className="flex flex-col gap-3 w-full">
          {THEME_NAMES.map((t) => {
            const colors = themes[t];
            const isSelected = value === t;
            return (
              <button
                key={t}
                onClick={() => onChange(t)}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  borderColor: isSelected ? colors.primary : 'transparent',
                  backgroundColor: isSelected ? colors.primaryLight || colors.background : 'var(--color-panel)',
                }}
              >
                <div className="flex gap-1.5">
                  {[colors.primary, colors.secondary, colors.background].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border border-theme-accent" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="font-medium text-sm text-theme-text">{t}</span>
                {isSelected && (
                  <span className="ml-auto text-sm" style={{ color: colors.primary }}>&#10003;</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-6 max-w-sm mx-auto w-full">
        <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
