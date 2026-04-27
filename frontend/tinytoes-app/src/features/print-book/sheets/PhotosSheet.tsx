import { useState, useMemo } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import type { PageContentItem } from '@/types';
import {
  UtensilsCrossed, Trophy, BookText, Image as ImageIcon,
  SlidersHorizontal, Sparkles, EyeOff,
} from 'lucide-react';

type ContentFilter = 'all' | 'foods' | 'milestones' | 'journal';
type SortMode = 'newest' | 'oldest';

interface PhotosSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: (PageContentItem & { key: string; dateMs?: number })[];
  usedKeys: Set<string>;
  /** Called when user selects a photo for the active slot */
  onSelect: (item: PageContentItem) => void;
  /** Autofill: distribute all unused photos into empty slots */
  onAutofill?: () => void;
}

export function PhotosSheet({
  isOpen, onClose, items, usedKeys, onSelect, onAutofill,
}: PhotosSheetProps) {
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [hideUsed, setHideUsed] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') {
      const typeMap: Record<ContentFilter, string> = { all: '', foods: 'food', milestones: 'milestone', journal: 'journal' };
      list = list.filter(i => i.sourceType === typeMap[filter]);
    }
    if (hideUsed) list = list.filter(i => !usedKeys.has(i.key));
    // Sort by date if available; fall back to original order
    list = [...list].sort((a, b) => {
      const da = a.dateMs ?? 0;
      const db = b.dateMs ?? 0;
      return sort === 'newest' ? db - da : da - db;
    });
    return list;
  }, [items, filter, sort, hideUsed, usedKeys]);

  const filterPills: { val: ContentFilter; label: string; Icon: typeof UtensilsCrossed | null }[] = [
    { val: 'all', label: 'All', Icon: null },
    { val: 'foods', label: 'Foods', Icon: UtensilsCrossed },
    { val: 'milestones', label: 'Milestones', Icon: Trophy },
    { val: 'journal', label: 'Journal', Icon: BookText },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Photos" maxHeight={60}>
      {/* Toolbar row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button
          onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1 text-[10px] text-gray-500 font-medium"
        >
          <SlidersHorizontal size={12} /> {sort === 'newest' ? 'Newest' : 'Oldest'}
        </button>
        {onAutofill && (
          <button
            onClick={onAutofill}
            className="flex items-center gap-1 text-[10px] text-theme-primary font-bold"
          >
            <Sparkles size={12} /> Autofill
          </button>
        )}
        <button
          onClick={() => setHideUsed(h => !h)}
          className={`flex items-center gap-1 text-[10px] font-medium ${hideUsed ? 'text-theme-primary' : 'text-gray-500'}`}
        >
          <EyeOff size={12} /> Hide used
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-3">
        {filterPills.map(({ val, label, Icon }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 transition-all ${
              filter === val ? 'bg-theme-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {Icon && <Icon size={10} />}
            {label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No content matches this filter.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(item => {
            const isUsed = usedKeys.has(item.key);
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  isUsed ? 'border-theme-primary/40 opacity-60' : 'border-transparent hover:border-theme-primary'
                }`}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-1">
                    <ImageIcon size={16} className="text-gray-400 mb-1" />
                    <span className="text-[8px] text-gray-500 text-center truncate w-full">{item.title}</span>
                  </div>
                )}
                {isUsed && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-theme-primary flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
