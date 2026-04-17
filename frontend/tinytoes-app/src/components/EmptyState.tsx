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
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-theme-primary-light">
        <Icon size={32} className="text-theme-primary" />
      </div>
      <p className="text-base font-medium text-theme-text">{title}</p>
      {subtitle && (
        <p className="text-sm mt-1 text-theme-muted max-w-xs mx-auto">{subtitle}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
