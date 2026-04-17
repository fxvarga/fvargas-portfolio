import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { UtensilsCrossed, Trophy, BookOpen, Camera, Clapperboard, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Slugs used for nav display — includes free features */
type NavSlug = 'first-foods' | 'milestones' | 'monthly-journal' | 'memory-book' | 'year-recap';

/** Free feature slugs that don't require their own purchase */
const FREE_FEATURE_SLUGS: NavSlug[] = ['memory-book', 'year-recap'];

const MODULE_NAV: { slug: NavSlug; icon: LucideIcon; label: string; path: string }[] = [
  { slug: 'year-recap', icon: Clapperboard, label: 'Recap', path: '/year-recap' },
  { slug: 'first-foods', icon: UtensilsCrossed, label: 'Foods', path: '/home' },
  { slug: 'milestones', icon: Trophy, label: 'Milestones', path: '/milestones' },
  { slug: 'monthly-journal', icon: BookOpen, label: 'Journal', path: '/journal' },
  { slug: 'memory-book', icon: Camera, label: 'Book', path: '/memory-book' },
];

interface ModuleNavBarProps {
  activeSlug: NavSlug;
}

export function ModuleNavBar({ activeSlug }: ModuleNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { products: entitlements, hasAnyCoreProduct } = useEntitlements(isAuthenticated);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 no-print safe-area-bottom"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderTop: '1px solid var(--color-accent)',
      }}
    >
      <div className="flex items-stretch justify-around h-16">
        {MODULE_NAV.map(mod => {
          const isFreeFeature = FREE_FEATURE_SLUGS.includes(mod.slug);
          const owned = isFreeFeature ? hasAnyCoreProduct() : entitlements.includes(mod.slug);
          const isActive = mod.slug === activeSlug;
          return (
            <button
              key={mod.slug}
              onClick={() => {
                if (!owned) {
                  navigate('/store');
                  return;
                }
                if (mod.path !== location.pathname) navigate(mod.path);
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors relative ${
                !owned ? 'opacity-40' : ''
              }`}
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              }}
              aria-label={!owned ? `${mod.label} — tap to view in store` : mod.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
              <mod.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {mod.label}
              </span>
              {!owned && <Lock size={10} className="absolute top-2 right-1/4" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
