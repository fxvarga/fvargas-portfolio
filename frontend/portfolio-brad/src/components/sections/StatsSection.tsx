import { useState, useEffect, useRef } from 'react';
import type { Stats } from '../../cms';

interface StatsSectionProps {
  stats: Stats;
}

function useCountUp(end: number, duration: number, start: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
}

function CounterItem({ value, suffix, label, started }: { value: string; suffix: string; label: string; started: boolean }) {
  const numericValue = parseInt(value, 10) || 0;
  const count = useCountUp(numericValue, 2000, started);

  return (
    <div className="text-center counter-separator px-4 py-6">
      <span className="block font-heading text-5xl lg:text-6xl font-bold text-orange-500 leading-tight" aria-label={`${value}${suffix}`}>
        {started ? count : 0}{suffix}
      </span>
      <p className="font-heading text-base font-normal text-dark mt-2">{label}</p>
    </div>
  );
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.items.map((stat, index) => (
            <CounterItem
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              started={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
