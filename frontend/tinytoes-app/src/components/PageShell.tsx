import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Extra padding at the bottom (e.g. pb-24 for FAB pages). Default: 'pb-24' */
  bottomPad?: string;
}

export function PageShell({ children, bottomPad = 'pb-24' }: PageShellProps) {
  return (
    <div className={`min-h-screen bg-theme-bg ${bottomPad}`}>
      {children}
    </div>
  );
}
