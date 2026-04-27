import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Button } from '@/components/Button';
import { generateId, compressImage } from '@/lib/imageUtils';
import { getJournalImages, type JournalEntry } from '@/types';
import { Plus, X, ImagePlus } from 'lucide-react';

interface AddJournalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: JournalEntry) => Promise<void>;
  onUpdate?: (entry: JournalEntry) => Promise<void>;
  editEntry?: JournalEntry | null;
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
}: AddJournalSheetProps) {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [monthLabel, setMonthLabel] = useState('');
  const [text, setText] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setImages(getJournalImages(editEntry));
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
    setImages([]);
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

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f)));
      setImages(prev => [...prev, ...compressed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!text.trim() && highlights.length === 0) {
      setError('Write something about this month or add some highlights!');
      return;
    }

    setIsSaving(true);
    try {
      const label = monthLabel.trim() || monthKeyToLabel(monthKey);
      // First image is also stored in legacy `image` for back-compat with older readers
      const cover = images[0] ?? null;

      if (isEditing && onUpdate) {
        const updated: JournalEntry = {
          ...editEntry,
          monthKey,
          monthLabel: label,
          text: text.trim(),
          highlights,
          image: cover,
          images,
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
          image: cover,
          images,
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
        {/* Photos (multi) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Photos
          </label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-theme-accent/20">
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold uppercase tracking-wide bg-black/60 text-white px-1.5 py-0.5 rounded">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500"
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-theme-primary disabled:opacity-50"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-muted)' }}
            >
              {isUploading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : images.length === 0 ? (
                <>
                  <ImagePlus size={20} />
                  <span className="text-[10px] font-medium">Add photos</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span className="text-[10px] font-medium">Add more</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            className="hidden"
          />
          {images.length > 1 && (
            <p className="text-[10px] text-theme-muted mt-1">
              {images.length} photos &middot; first one is used as the cover.
            </p>
          )}
        </div>

        {/* Month picker */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Month
          </label>
          <select
            value={monthKey}
            onChange={e => setMonthKey(e.target.value)}
            disabled={isEditing}
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:border-[var(--color-primary)]"
            style={{
              backgroundColor: 'var(--color-panel)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {monthOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
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
              className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-colors focus:border-[var(--color-primary)]"
              style={{
                backgroundColor: 'var(--color-panel)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-accent)',
              }}
            />
            <button
              type="button"
              onClick={addHighlight}
              className="px-4 py-2 rounded-full text-sm font-medium"
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
