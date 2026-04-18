import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

  return (
    <div
      className={`rounded-2xl border border-theme-accent/60 ${paddings[padding]} ${hoverable ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-panel)',
        boxShadow: '0 1px 3px rgba(61,44,46,0.04), 0 4px 12px rgba(61,44,46,0.03)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
