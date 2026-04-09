import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { MILESTONE_CATEGORIES, type Milestone } from '@/types';

interface MilestoneDetailProps {
  milestone: Milestone;
  onClose: () => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => Promise<void>;
}

export function MilestoneDetail({ milestone, onClose, onEdit, onDelete }: MilestoneDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const category = MILESTONE_CATEGORIES.find(c => c.value === milestone.category);

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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal isOpen onClose={onClose} title={milestone.title}>
      <div className="space-y-5">
        {/* Image */}
        {milestone.image && (
          <div className="w-full rounded-2xl overflow-hidden">
            <img
              src={milestone.image}
              alt={milestone.title}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        )}

        {/* Category badge */}
        <div className="flex items-center gap-3">
          <div
            className="px-4 py-2 rounded-full flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <span className="text-xl">{category?.icon || '⭐'}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              {category?.label || 'Other'}
            </span>
          </div>
        </div>

        {/* Date */}
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {formattedDate}
        </p>

        {/* Notes */}
        {milestone.notes && (
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Notes</label>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {milestone.notes}
            </p>
          </div>
        )}

        {/* Edit */}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => onEdit(milestone)}
        >
          Edit Milestone
        </Button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-center text-red-500 font-medium">
              Delete this milestone? This can't be undone.
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
            Delete milestone
          </button>
        )}
      </div>
    </Modal>
  );
}
