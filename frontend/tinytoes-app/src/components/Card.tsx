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
      className={`rounded-2xl shadow-sm ${paddings[padding]} ${hoverable ? 'transition-shadow duration-200 hover:shadow-md cursor-pointer' : ''} ${className}`}
      style={{ backgroundColor: 'var(--color-panel)' }}
      {...props}
    >
      {children}
    </div>
  );
}
