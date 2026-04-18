import { useState, useRef } from 'react';
import { ArrowLeft, Pencil, Trash2, Camera, Trophy } from 'lucide-react';
import { Button } from '@/components/Button';
import { MILESTONE_CATEGORIES, type Milestone } from '@/types';

interface MilestoneDetailProps {
  milestone: Milestone;
  items?: Milestone[];
  onClose: () => void;
  onNavigate?: (milestone: Milestone) => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => Promise<void>;
}

export function MilestoneDetail({ milestone, items, onClose, onNavigate, onEdit, onDelete }: MilestoneDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const category = MILESTONE_CATEGORIES.find(c => c.value === milestone.category);

  const currentIndex = items?.findIndex(i => i.id === milestone.id) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = items ? currentIndex < items.length - 1 : false;

  const goNext = () => {
    if (hasNext && items && onNavigate) onNavigate(items[currentIndex + 1]);
  };
  const goPrev = () => {
    if (hasPrev && items && onNavigate) onNavigate(items[currentIndex - 1]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(milestone.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formattedDate = new Date(milestone.achievedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image */}
      <div className="absolute inset-0">
        {milestone.image ? (
          <img src={milestone.image} alt={milestone.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-theme-primary via-theme-secondary to-theme-accent flex items-center justify-center">
            <Camera size={80} className="text-white/20" />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>

        {items && items.length > 1 && (
          <span className="text-xs font-medium text-white/70">{currentIndex + 1} / {items.length}</span>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(milestone)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Text overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={14} className="text-white/70" />
          <span className="text-xs font-medium tracking-wider uppercase text-white/70">Milestone</span>
        </div>

        <h2 className="text-2xl font-bold text-white leading-tight mb-1 font-display tracking-tight">
          {milestone.title}
        </h2>

        {category && (
          <p className="text-sm font-medium text-white/80 mb-1">{category.label}</p>
        )}

        <p className="text-xs text-white/60 mb-3">{formattedDate}</p>

        {milestone.notes && (
          <p className="text-sm text-white/80 leading-relaxed line-clamp-3 italic">
            "{milestone.notes}"
          </p>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs space-y-4">
            <p className="text-sm text-center font-medium text-red-500">
              Delete this milestone? This can't be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                loading={isDeleting}
                onClick={handleDelete}
                className="!bg-red-500 hover:!bg-red-600"
                style={{ backgroundColor: '#ef4444' }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
