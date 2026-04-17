import type { JournalRecap } from './useRecapData';
import { BookOpen, Quote, Sparkles } from 'lucide-react';

interface Props {
  data: JournalRecap;
}

export function RecapJournal({ data }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-theme-primary-light flex items-center justify-center">
          <BookOpen size={16} className="text-theme-primary" />
        </div>
        <h2 className="text-lg font-bold text-theme-text">Monthly Reflections</h2>
      </div>

      {/* Months written */}
      <div className="rounded-2xl p-5 bg-theme-panel text-center">
        <div className="text-4xl font-bold text-theme-primary mb-1">{data.totalMonths}</div>
        <div className="text-sm text-theme-muted">
          {data.totalMonths === 1 ? 'month documented' : 'months documented'}
        </div>
      </div>

      {/* Featured excerpt */}
      {data.excerpt && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <div className="flex items-start gap-2 mb-2">
            <Quote size={16} className="text-theme-primary shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-theme-text">From Your Journal</h3>
          </div>
          <blockquote className="text-sm text-theme-muted leading-relaxed italic pl-6 border-l-2 border-theme-primary/30">
            "{data.excerpt}"
          </blockquote>
        </div>
      )}

      {/* Highlights cloud */}
      {data.highlights.length > 0 && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-theme-secondary" />
            <h3 className="text-sm font-semibold text-theme-text">Highlights</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.highlights.map((h, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1.5 text-xs font-medium bg-theme-bg text-theme-text"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Month-by-month mini cards */}
      {data.entries.length > 1 && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <h3 className="text-sm font-semibold text-theme-text mb-3">Month by Month</h3>
          <div className="grid grid-cols-3 gap-2">
            {data.entries.map(entry => (
              <div
                key={entry.id}
                className="rounded-xl p-2.5 bg-theme-bg text-center"
              >
                <div className="text-xs font-semibold text-theme-primary">{entry.monthLabel}</div>
                {entry.highlights.length > 0 && (
                  <div className="text-[10px] text-theme-muted mt-0.5">
                    {entry.highlights.length} highlight{entry.highlights.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
