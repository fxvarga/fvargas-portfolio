import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import type { ProductSlug } from '@/types';

const MODULE_NAV: { slug: ProductSlug; icon: string; label: string; path: string }[] = [
  { slug: 'first-foods', icon: '🥄', label: 'First Foods', path: '/home' },
  { slug: 'milestones', icon: '🏆', label: 'Milestones', path: '/milestones' },
  { slug: 'monthly-journal', icon: '📖', label: 'Journal', path: '/journal' },
  { slug: 'memory-book', icon: '📸', label: 'Memory Book', path: '/memory-book' },
  { slug: 'year-recap', icon: '🎬', label: 'Year Recap', path: '/year-recap' },
];

interface ModuleNavBarProps {
  activeSlug: ProductSlug;
}

export function ModuleNavBar({ activeSlug }: ModuleNavBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { products: entitlements } = useEntitlements(isAuthenticated);

  return (
    <div className="px-4 pb-3 no-print">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {MODULE_NAV.map(mod => {
          const owned = entitlements.includes(mod.slug);
          const isActive = mod.slug === activeSlug;
          return (
            <button
              key={mod.slug}
              onClick={() => {
                if (!owned) {
                  navigate('/store');
                  return;
                }
                if (mod.path !== window.location.pathname) navigate(mod.path);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'shadow-sm'
                  : owned
                    ? 'hover:bg-black/5'
                    : 'opacity-50 cursor-pointer'
              }`}
              style={isActive ? {
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              } : {
                backgroundColor: owned ? 'var(--color-panel)' : 'transparent',
                color: 'var(--color-text)',
              }}
              title={!owned ? 'Tap to view in store' : mod.label}
            >
              <span>{mod.icon}</span>
              <span>{mod.label}</span>
              {!owned && <span className="text-[10px]">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
