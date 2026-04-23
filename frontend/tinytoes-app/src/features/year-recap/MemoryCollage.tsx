import { Camera } from 'lucide-react';
import type { TimelineItem } from './useRecapData';

interface Props {
  items: TimelineItem[];
  onItemClick?: (index: number) => void;
}

export function MemoryCollage({ items, onItemClick }: Props) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Camera size={16} className="text-theme-primary" />
        <h2 className="text-base font-bold font-display tracking-tight text-theme-text">
          Photo Memories
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(i)}
            className={`relative overflow-hidden bg-theme-bg cursor-pointer ${
              /* Make the first image span 2 rows if we have 4+ photos */
              i === 0 && items.length >= 4 ? 'row-span-2 aspect-[2/3]' : 'aspect-square'
            }`}
          >
            <img
              src={item.image!}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {/* Subtle gradient at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-1 left-1.5 text-[9px] font-medium text-white/90 drop-shadow-sm line-clamp-1">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
