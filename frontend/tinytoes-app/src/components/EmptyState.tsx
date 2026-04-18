import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 flex flex-col items-center justify-center min-h-[40vh]">
      <div
        className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center bg-theme-primary-light"
        style={{ boxShadow: '0 0 0 8px var(--color-primary-light, rgba(143,185,150,0.15))' }}
      >
        <Icon size={36} className="text-theme-primary" strokeWidth={1.5} />
      </div>
      <p className="text-lg font-semibold font-display tracking-tight text-theme-text">{title}</p>
      {subtitle && (
        <p className="text-sm mt-2 text-theme-muted max-w-[16rem] mx-auto leading-relaxed">{subtitle}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
