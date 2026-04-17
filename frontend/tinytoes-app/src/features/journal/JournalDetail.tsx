import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { BookOpen } from 'lucide-react';
import type { JournalEntry } from '@/types';

interface JournalDetailProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

export function JournalDetail({ entry, onClose, onEdit, onDelete }: JournalDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const dateLabel = (() => {
    const [year, month] = entry.monthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <Modal isOpen onClose={onClose} title={entry.monthLabel}>
      <div className="space-y-5">
        {/* Image */}
        {entry.image && (
          <div className="w-full rounded-2xl overflow-hidden">
            <img
              src={entry.image}
              alt={entry.monthLabel}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        )}

        {/* Month badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full flex items-center gap-2 bg-theme-primary-light">
            <BookOpen size={20} className="text-theme-primary" />
            <span className="text-sm font-medium text-theme-primary">
              {dateLabel}
            </span>
          </div>
        </div>

        {/* Highlights */}
        {entry.highlights.length > 0 && (
          <div>
            <label className="text-sm font-medium text-theme-text">Highlights</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {entry.highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full font-medium bg-theme-primary-light text-theme-primary"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text */}
        {entry.text && (
          <div>
            <label className="text-sm font-medium text-theme-text">Reflection</label>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-theme-muted">
              {entry.text}
            </p>
          </div>
        )}

        {/* Edit */}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => onEdit(entry)}
        >
          Edit Entry
        </Button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-center text-red-500 font-medium">
              Delete this journal entry? This can't be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setConfirmDelete(false)}
              >
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
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-center text-sm font-medium py-2 transition-colors text-theme-muted"
          >
            Delete entry
          </button>
        )}
      </div>
    </Modal>
  );
}
