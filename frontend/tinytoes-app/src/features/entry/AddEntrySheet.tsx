import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ReactionPicker } from '@/components/ReactionPicker';
import { generateId } from '@/lib/imageUtils';
import type { FoodEntry, Reaction } from '@/types';

/** Convert a timestamp to a local YYYY-MM-DD string for date inputs */
function toLocalDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert a YYYY-MM-DD string back to a timestamp, preserving the time from fallback */
function fromLocalDate(dateStr: string, fallbackTs: number): number {
  const fallback = new Date(fallbackTs);
  const [y, m, d] = dateStr.split('-').map(Number);
  const result = new Date(y, m - 1, d, fallback.getHours(), fallback.getMinutes(), fallback.getSeconds(), fallback.getMilliseconds());
  return result.getTime();
}

interface AddEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => Promise<void>;
  onUpdate?: (entry: FoodEntry) => Promise<void>;
  editEntry?: FoodEntry | null;
}

export function AddEntrySheet({ isOpen, onClose, onAdd, onUpdate, editEntry }: AddEntrySheetProps) {
  const [food, setFood] = useState('');
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [date, setDate] = useState(() => toLocalDate(Date.now()));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editEntry;

  // Pre-populate fields when editing
  useEffect(() => {
    if (editEntry && isOpen) {
      setFood(editEntry.food);
      setReaction(editEntry.reaction);
      setNotes(editEntry.notes);
      setImage(editEntry.image);
      setDate(toLocalDate(editEntry.createdAt));
      setError(null);
      setIsSaving(false);
    }
  }, [editEntry, isOpen]);

  const reset = () => {
    setFood('');
    setReaction(null);
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

    if (!food.trim()) {
      setError('What food did your baby try?');
      return;
    }
    if (!reaction) {
      setError('How did they react?');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && onUpdate) {
        const updated: FoodEntry = {
          ...editEntry,
          food: food.trim(),
          reaction,
          notes: notes.trim(),
          image,
          createdAt: fromLocalDate(date, editEntry.createdAt),
        };
        await onUpdate(updated);
      } else {
        const entry: FoodEntry = {
          id: generateId(),
          food: food.trim(),
          reaction,
          notes: notes.trim(),
          image,
          createdAt: fromLocalDate(date, Date.now()),
        };
        await onAdd(entry);
      }
      reset();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Entry' : 'New Entry'}>
      <div className="space-y-5">
        {/* Photo */}
        <PhotoUpload value={image} onChange={setImage} />

        {/* Food name */}
        <Input
          label="Food"
          placeholder="e.g. Avocado, Sweet potato..."
          value={food}
          onChange={e => setFood(e.target.value)}
          autoFocus
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          max={toLocalDate(Date.now())}
          onChange={e => setDate(e.target.value)}
        />

        {/* Reaction */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Reaction
          </label>
          <ReactionPicker value={reaction} onChange={setReaction} />
        </div>

        {/* Notes */}
        <TextArea
          label="Notes (optional)"
          placeholder="First try! Made a funny face..."
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
          {isEditing ? 'Save Changes' : 'Save Entry'}
        </Button>
      </div>
    </Modal>
  );
}
