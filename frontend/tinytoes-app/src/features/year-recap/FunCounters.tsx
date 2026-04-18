import { useEffect, useRef, useState } from 'react';
import { UtensilsCrossed, Trophy, BookOpen, Camera, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  totalFoods: number;
  totalMilestones: number;
  totalJournalMonths: number;
  totalPhotos: number;
  loggingStreak: number;
}

interface CounterDef {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
}

function AnimatedNumber({ target, duration = 800 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current || target === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref} className="text-2xl font-bold font-display text-theme-primary">{current}</div>;
}

export function FunCounters({ totalFoods, totalMilestones, totalJournalMonths, totalPhotos, loggingStreak }: Props) {
  const counters: CounterDef[] = [
    { icon: UtensilsCrossed, value: totalFoods, label: 'Foods Tried' },
    { icon: Trophy, value: totalMilestones, label: 'Milestones' },
    { icon: BookOpen, value: totalJournalMonths, label: 'Months' },
  ].filter(c => c.value > 0);

  // Add streak or photos as bonus counter
  if (loggingStreak > 1) {
    counters.push({ icon: Flame, value: loggingStreak, label: 'Day Streak' });
  } else if (totalPhotos > 0) {
    counters.push({ icon: Camera, value: totalPhotos, label: 'Photos' });
  }

  if (counters.length === 0) return null;

  return (
    <section>
      <div className={`grid gap-3 ${counters.length >= 4 ? 'grid-cols-4' : counters.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {counters.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="rounded-2xl p-4 bg-theme-panel border border-theme-accent text-center"
          >
            <Icon size={18} className="text-theme-primary mx-auto mb-1.5" />
            <AnimatedNumber target={value} />
            <div className="text-[10px] text-theme-muted mt-0.5 font-medium tracking-tight">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
