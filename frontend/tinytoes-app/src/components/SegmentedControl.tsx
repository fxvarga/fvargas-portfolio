interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div
      className="flex rounded-xl p-1 gap-0.5"
      style={{ backgroundColor: 'var(--color-accent)' }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'shadow-sm' : ''}`}
            style={{
              backgroundColor: isActive ? 'var(--color-panel)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
