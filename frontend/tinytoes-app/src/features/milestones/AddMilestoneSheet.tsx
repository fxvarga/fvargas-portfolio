import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';
import { generateId } from '@/lib/imageUtils';
import { MILESTONE_CATEGORIES, type Milestone, type MilestoneCategory } from '@/types';
import {
  Activity,
  Heart,
  MessageCircle,
  Brain,
  Baby,
  Star,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

const CATEGORY_ICONS: Record<string, ComponentType<LucideProps>> = {
  activity: Activity,
  heart: Heart,
  'message-circle': MessageCircle,
  brain: Brain,
  baby: Baby,
  star: Star,
};

function toLocalDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fromLocalDate(dateStr: string, fallbackTs: number): number {
  const fallback = new Date(fallbackTs);
  const [y, m, d] = dateStr.split('-').map(Number);
  const result = new Date(y, m - 1, d, fallback.getHours(), fallback.getMinutes(), fallback.getSeconds(), fallback.getMilliseconds());
  return result.getTime();
}

interface AddMilestoneSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (milestone: Milestone) => Promise<void>;
  onUpdate?: (milestone: Milestone) => Promise<void>;
  editMilestone?: Milestone | null;
}

export function AddMilestoneSheet({ isOpen, onClose, onAdd, onUpdate, editMilestone }: AddMilestoneSheetProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MilestoneCategory>('motor');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [date, setDate] = useState(() => toLocalDate(Date.now()));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editMilestone;

  useEffect(() => {
    if (editMilestone && isOpen) {
      setTitle(editMilestone.title);
      setCategory(editMilestone.category);
      setNotes(editMilestone.notes);
      setImage(editMilestone.image);
      setDate(toLocalDate(editMilestone.achievedAt));
      setError(null);
      setIsSaving(false);
    }
  }, [editMilestone, isOpen]);

  const reset = () => {
    setTitle('');
    setCategory('motor');
    setNotes('');
    setImage(null);
    setDate(toLocalDate(Date.now()));
    setError(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('What milestone did your baby reach?');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && onUpdate) {
        const updated: Milestone = {
          ...editMilestone,
          title: title.trim(),
          category,
          notes: notes.trim(),
          image,
          achievedAt: fromLocalDate(date, editMilestone.achievedAt),
        };
        await onUpdate(updated);
      } else {
        const milestone: Milestone = {
          id: generateId(),
          title: title.trim(),
          category,
          notes: notes.trim(),
          image,
          achievedAt: fromLocalDate(date, Date.now()),
          createdAt: Date.now(),
        };
        await onAdd(milestone);
      }
      reset();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Milestone' : 'New Milestone'}>
      <div className="space-y-5">
        {/* Photo */}
        <PhotoUpload value={image} onChange={setImage} />

        {/* Title */}
        <Input
          label="Milestone"
          placeholder="e.g. First smile, Sat up alone..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        {/* Date */}
        <Input
          label="Date achieved"
          type="date"
          value={date}
          max={toLocalDate(Date.now())}
          onChange={e => setDate(e.target.value)}
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2 text-theme-text">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MILESTONE_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon] || Star;
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium text-center transition-all flex flex-col items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-theme-primary-light text-theme-primary border-theme-primary shadow-sm'
                      : 'bg-theme-panel text-theme-text border-theme-accent/60'
                  }`}
                >
                  <Icon size={20} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <TextArea
          label="Notes (optional)"
          placeholder="They were so excited! We were at the park..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Submit */}
        <Button
          fullWidth
          size="lg"
          loading={isSaving}
          onClick={handleSubmit}
        >
          {isEditing ? 'Save Changes' : 'Save Milestone'}
        </Button>
      </div>
    </Modal>
  );
}
