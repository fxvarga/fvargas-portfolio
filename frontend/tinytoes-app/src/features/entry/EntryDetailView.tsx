import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { REACTIONS, type FoodEntry } from '@/types';

interface EntryDetailViewProps {
  entry: FoodEntry;
  onClose: () => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

export function EntryDetailView({ entry, onClose, onEdit, onDelete }: EntryDetailViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reactionLabel = REACTIONS.find(r => r.emoji === entry.reaction)?.label ?? '';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal isOpen onClose={onClose} title={entry.food}>
      <div className="space-y-5">
        {/* Image */}
        {entry.image && (
          <div className="w-full rounded-2xl overflow-hidden">
            <img
              src={entry.image}
              alt={entry.food}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        )}

        {/* Reaction badge */}
        <div className="flex items-center gap-3">
          <div
            className="px-4 py-2 rounded-full flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <span className="text-xl">{entry.reaction}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              {reactionLabel}
            </span>
          </div>
        </div>

        {/* Date */}
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {formattedDate}
        </p>

        {/* Notes */}
        {entry.notes && (
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Notes</label>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {entry.notes}
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
              Delete this entry? This can't be undone.
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
            className="w-full text-center text-sm font-medium py-2 transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            Delete entry
          </button>
        )}
      </div>
    </Modal>
  );
}
