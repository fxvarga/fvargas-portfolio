import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'gray';
}

const variantStyles = {
  blue: 'bg-primary-100 text-primary-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-700',
};

export default function Badge({ children, variant = 'blue' }: BadgeProps) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
