import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, UtensilsCrossed, Trophy, BookText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FoodEntry, Milestone, JournalEntry } from '@/types';
import { REACTIONS, MILESTONE_CATEGORIES } from '@/types';

/* ── Types ──────────────────────────────────────────────── */

export type SlideItem =
  | { type: 'food'; data: FoodEntry }
  | { type: 'milestone'; data: Milestone }
  | { type: 'journal'; data: JournalEntry };

type InternalSlide =
  | { kind: 'cover'; monthLabel: string; image: string | undefined }
  | { kind: 'content'; item: SlideItem };

interface Props {
  items: SlideItem[];
  startIndex?: number;
  onClose: () => void;
}

/* ── Constants ──────────────────────────────────────────── */

const SLIDE_DURATION = 5000;
const COVER_DURATION = 3000;
const TRANSITION_MS = 600;

/* ── Helpers ────────────────────────────────────────────── */

function getItemMonthKey(item: SlideItem): string {
  switch (item.type) {
    case 'food': {
      const d = new Date(item.data.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    case 'milestone': {
      const d = new Date(item.data.achievedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    case 'journal':
      return item.data.monthKey;
  }
}

function getItemImage(item: SlideItem): string | undefined {
  switch (item.type) {
    case 'food': return item.data.image ?? undefined;
    case 'milestone': return item.data.image ?? undefined;
    case 'journal': return item.data.image ?? undefined;
  }
}

function monthKeyToLabel(key: string): { month: string; year: string } {
  const [y, m] = key.split('-').map(Number);
  const date = new Date(y, m - 1);
  return {
    month: date.toLocaleDateString(undefined, { month: 'long' }),
    year: String(y),
  };
}

function getSlideInfo(item: SlideItem) {
  switch (item.type) {
    case 'food': {
      const d = item.data;
      const reaction = REACTIONS.find(r => r.key === d.reaction)?.label ?? '';
      return {
        icon: UtensilsCrossed,
        image: d.image,
        title: d.food,
        subtitle: reaction,
        date: new Date(d.createdAt).toLocaleDateString(undefined, {
          month: 'long', day: 'numeric', year: 'numeric',
        }),
        body: d.notes,
        label: 'First Foods',
      };
    }
    case 'milestone': {
      const d = item.data;
      const cat = MILESTONE_CATEGORIES.find(c => c.value === d.category)?.label ?? '';
      return {
        icon: Trophy,
        image: d.image,
        title: d.title,
        subtitle: cat,
        date: new Date(d.achievedAt).toLocaleDateString(undefined, {
          month: 'long', day: 'numeric', year: 'numeric',
        }),
        body: d.notes,
        label: 'Milestone',
      };
    }
    case 'journal': {
      const d = item.data;
      const [year, month] = d.monthKey.split('-').map(Number);
      return {
        icon: BookText,
        image: d.image,
        title: d.monthLabel,
        subtitle: d.highlights.slice(0, 2).join(' \u00b7 '),
        date: new Date(year, month - 1).toLocaleDateString(undefined, {
          month: 'long', year: 'numeric',
        }),
        body: d.text,
        label: 'Journal',
      };
    }
  }
}

/* ── Build slides with month covers ─────────────────────── */

function buildSlides(items: SlideItem[]): { slides: InternalSlide[]; mappedStartIndex: (origIndex: number) => number } {
  const slides: InternalSlide[] = [];
  let lastMonth = '';
  const origToSlide: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const mk = getItemMonthKey(items[i]);
    if (mk !== lastMonth) {
      // Find first image in this month group for the cover
      let coverImage: string | undefined;
      for (let j = i; j < items.length; j++) {
        if (getItemMonthKey(items[j]) !== mk) break;
        const img = getItemImage(items[j]);
        if (img) { coverImage = img; break; }
      }
      const { month, year } = monthKeyToLabel(mk);
      slides.push({ kind: 'cover', monthLabel: `${month}\n${year}`, image: coverImage });
      lastMonth = mk;
    }
    origToSlide.push(slides.length);
    slides.push({ kind: 'content', item: items[i] });
  }

  return {
    slides,
    mappedStartIndex: (origIndex: number) => origToSlide[origIndex] ?? 0,
  };
}

/* ── Component ──────────────────────────────────────────── */

export function MemorySlideshow({ items, startIndex = 0, onClose }: Props) {
  const { slides, mappedStartIndex } = useMemo(() => buildSlides(items), [items]);
  const [current, setCurrent] = useState(() => mappedStartIndex(startIndex));
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const total = slides.length;
  const currentSlide = slides[current];
  const isCover = currentSlide.kind === 'cover';
  const duration = isCover ? COVER_DURATION : SLIDE_DURATION;

  const goTo = useCallback((index: number) => {
    setFadeState('out');
    setTimeout(() => {
      setCurrent(index);
      setProgress(0);
      startTimeRef.current = Date.now();
      setFadeState('in');
    }, TRANSITION_MS / 2);
  }, []);

  const next = useCallback(() => {
    if (current < total - 1) goTo(current + 1);
    else onClose();
  }, [current, total, goTo, onClose]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now() - progress * duration;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        next();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, current, next, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset progress on slide change
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [current]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, next, prev]);

  // Touch handling
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setPaused(false);
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  // Tap left/right to navigate
  const onTapArea = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) prev();
    else if (x > rect.width * 0.7) next();
    else setPaused(p => !p);
  };

  // Count only content slides for the counter
  const contentIndex = slides.slice(0, current + 1).filter(s => s.kind === 'content').length;
  const contentTotal = slides.filter(s => s.kind === 'content').length;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-[env(safe-area-inset-top,12px)] pb-1">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width:
                  i < current ? '100%' :
                  i === current ? `${progress * 100}%` :
                  '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[calc(env(safe-area-inset-top,12px)+16px)] right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Slide counter (content only) */}
      {!isCover && (
        <div className="absolute top-[calc(env(safe-area-inset-top,12px)+22px)] left-4 z-30 text-white/70 text-xs font-medium">
          {contentIndex} / {contentTotal}
        </div>
      )}

      {/* Main content area */}
      <div
        className="flex-1 relative overflow-hidden"
        onClick={onTapArea}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {isCover ? (
          /* ── Month Cover Slide ──────────────────────── */
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: fadeState === 'in' ? 1 : 0,
              transitionDuration: `${TRANSITION_MS / 2}ms`,
            }}
            key={`cover-${current}`}
          >
            {currentSlide.image ? (
              <img
                src={currentSlide.image}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'blur(20px) brightness(0.5)', transform: 'scale(1.1)' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-theme-primary via-theme-secondary to-theme-accent" />
            )}
            {/* Dark overlay on top of blur */}
            <div className="absolute inset-0 bg-black/30" />
            {/* Month text */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div
                className="text-center transition-all"
                style={{
                  opacity: fadeState === 'in' ? 1 : 0,
                  transform: fadeState === 'in' ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transitionDuration: `${TRANSITION_MS}ms`,
                }}
              >
                {currentSlide.monthLabel.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={
                      i === 0
                        ? 'text-5xl font-bold text-white font-display tracking-tight leading-tight'
                        : 'text-2xl font-light text-white/70 tracking-widest mt-2'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Content Slide ──────────────────────────── */
          <>
            <div
              className="absolute inset-0 transition-opacity"
              style={{
                opacity: fadeState === 'in' ? 1 : 0,
                transitionDuration: `${TRANSITION_MS / 2}ms`,
              }}
            >
              {(() => {
                const slide = getSlideInfo(currentSlide.item);
                return slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover animate-ken-burns"
                    key={current}
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-theme-primary via-theme-secondary to-theme-accent flex items-center justify-center"
                    key={current}
                  >
                    <slide.icon size={80} className="text-white/20" />
                  </div>
                );
              })()}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Text overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-10 transition-all"
              style={{
                opacity: fadeState === 'in' ? 1 : 0,
                transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(12px)',
                transitionDuration: `${TRANSITION_MS / 2}ms`,
              }}
            >
              {(() => {
                const slide = getSlideInfo(currentSlide.item);
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <slide.icon size={14} className="text-white/70" />
                      <span className="text-xs font-medium tracking-wider uppercase text-white/70">
                        {slide.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight mb-1 font-display tracking-tight">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-sm font-medium text-white/80 mb-1">{slide.subtitle}</p>
                    )}
                    <p className="text-xs text-white/60 mb-3">{slide.date}</p>
                    {slide.body && (
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3 italic">
                        "{slide.body}"
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* Nav arrows (desktop) */}
        {current > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors hidden sm:flex"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {current < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors hidden sm:flex"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Pause indicator */}
        {paused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="flex gap-2">
              <div className="w-4 h-12 bg-white/40 rounded-sm" />
              <div className="w-4 h-12 bg-white/40 rounded-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
