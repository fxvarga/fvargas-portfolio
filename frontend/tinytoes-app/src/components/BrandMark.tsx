interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { container: 'w-6 h-6', svg: 14, text: 'text-sm' },
  md: { container: 'w-8 h-8', svg: 18, text: 'text-lg' },
  lg: { container: 'w-16 h-16', svg: 32, text: 'text-2xl' },
} as const;

/** Baby footprint SVG + "TinyToes" logotype */
export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.container} rounded-lg flex items-center justify-center bg-theme-primary-light`}>
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 24 24"
          fill="none"
          className="text-theme-primary"
        >
          {/* Baby footprint */}
          <ellipse cx="12" cy="16" rx="5" ry="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="8" cy="7" r="1.8" fill="currentColor" />
          <circle cx="11" cy="5" r="1.8" fill="currentColor" />
          <circle cx="14.5" cy="5.5" r="1.6" fill="currentColor" />
          <circle cx="17" cy="7.5" r="1.4" fill="currentColor" />
        </svg>
      </div>
      <span className={`font-bold ${s.text} text-theme-text`}>TinyToes</span>
    </div>
  );
}
