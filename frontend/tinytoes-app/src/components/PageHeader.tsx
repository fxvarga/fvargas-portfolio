import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Show back arrow instead of settings gear */
  backButton?: boolean;
  /** Extra action buttons to the right of the title */
  actions?: ReactNode;
}

export function PageHeader({ title, backButton, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="px-4 pt-6 pb-2 flex items-center justify-between no-print">
      {backButton ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-theme-text"
            aria-label="Go back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-theme-text">{title}</h1>
        </div>
      ) : (
        <h1 className="text-xl font-bold text-theme-text">{title}</h1>
      )}
      <div className="flex gap-2">
        {actions}
        {!backButton && (
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-theme-muted"
            aria-label="Settings"
          >
            <Settings size={22} />
          </button>
        )}
      </div>
    </header>
  );
}
