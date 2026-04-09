import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';
import { generateId } from '@/lib/imageUtils';
import type { JournalEntry } from '@/types';

interface AddJournalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: JournalEntry) => Promise<void>;
  onUpdate?: (entry: JournalEntry) => Promise<void>;
  editEntry?: JournalEntry | null;
  existingMonthKeys: string[];
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyToLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/** Generate list of month options for the last 24 months */
function getMonthOptions(): { key: string; label: string }[] {
  const options: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    options.push({ key, label });
  }
  return options;
}

export function AddJournalSheet({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editEntry,
  existingMonthKeys,
}: AddJournalSheetProps) {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [monthLabel, setMonthLabel] = useState('');
  const [text, setText] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editEntry;
  const monthOptions = getMonthOptions();

  useEffect(() => {
    if (editEntry && isOpen) {
      setMonthKey(editEntry.monthKey);
      setMonthLabel(editEntry.monthLabel);
      setText(editEntry.text);
      setHighlights(editEntry.highlights);
      setImage(editEntry.image);
      setError(null);
      setIsSaving(false);
      setHighlightInput('');
    }
  }, [editEntry, isOpen]);

  const reset = () => {
    setMonthKey(getCurrentMonthKey());
    setMonthLabel('');
    setText('');
    setHighlights([]);
    setHighlightInput('');
    setImage(null);
    setError(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (trimmed && !highlights.includes(trimmed)) {
      setHighlights(prev => [...prev, trimmed]);
      setHighlightInput('');
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!text.trim() && highlights.length === 0) {
      setError('Write something about this month or add some highlights!');
      return;
    }

    // Check for duplicate month (only on add, not edit)
    if (!isEditing && existingMonthKeys.includes(monthKey)) {
      setError('You already have an entry for this month. Edit the existing one instead.');
      return;
    }

    setIsSaving(true);
    try {
      const label = monthLabel.trim() || monthKeyToLabel(monthKey);

      if (isEditing && onUpdate) {
        const updated: JournalEntry = {
          ...editEntry,
          monthKey,
          monthLabel: label,
          text: text.trim(),
          highlights,
          image,
          updatedAt: Date.now(),
        };
        await onUpdate(updated);
      } else {
        const entry: JournalEntry = {
          id: generateId(),
          monthKey,
          monthLabel: label,
          text: text.trim(),
          highlights,
          image,
          createdAt: Date.now(),
          updatedAt: Date.now(),
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
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}>
      <div className="space-y-5">
        {/* Photo */}
        <PhotoUpload value={image} onChange={setImage} />

        {/* Month picker */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Month
          </label>
          <select
            value={monthKey}
            onChange={e => setMonthKey(e.target.value)}
            disabled={isEditing}
            className="w-full px-4 py-3 rounded-xl text-sm border-0 outline-none"
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
            }}
          >
            {monthOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
                {!isEditing && existingMonthKeys.includes(opt.key) ? ' (already written)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Custom label */}
        <Input
          label="Title (optional)"
          placeholder={`e.g. Month 3, "The Crawling Month"...`}
          value={monthLabel}
          onChange={e => setMonthLabel(e.target.value)}
        />

        {/* Reflection text */}
        <TextArea
          label="Reflection"
          placeholder="What was this month like? What moments stand out? How has your baby grown?"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
        />

        {/* Highlights */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Highlights
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={highlightInput}
              onChange={e => setHighlightInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
              placeholder="e.g. First giggle, New tooth..."
              className="flex-1 px-3 py-2 rounded-xl text-sm border-0 outline-none"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
              }}
            />
            <button
              type="button"
              onClick={addHighlight}
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              }}
            >
              Add
            </button>
          </div>
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {h}
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

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
