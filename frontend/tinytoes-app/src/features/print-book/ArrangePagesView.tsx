import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BookProject, BookPage } from '@/types';
import { PageCanvas } from './PageCanvas';
import { CoverCanvas } from './CoverCanvas';
import { Trash2, Lock } from 'lucide-react';

interface ArrangePagesViewProps {
  project: BookProject;
  onReorder: (orderedPageIds: string[]) => void;
  onRemovePage: (pageId: string) => void;
  onCoverTap?: () => void;
}

export function ArrangePagesView({
  project, onReorder, onRemovePage, onCoverTap,
}: ArrangePagesViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const pageIds = project.pages.map(p => p.id);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = pageIds.indexOf(active.id as string);
    const newIdx = pageIds.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return;
    // Disallow dragging locked pages, and disallow dropping into a locked slot
    if (project.pages[oldIdx]?.locked || project.pages[newIdx]?.locked) return;
    const newIds = [...pageIds];
    newIds.splice(oldIdx, 1);
    newIds.splice(newIdx, 0, active.id as string);
    onReorder(newIds);
  }, [pageIds, onReorder, project.pages]);

  return (
    <div className="px-2">
      {/* Cover (non-draggable) */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-400 font-medium uppercase mb-1 px-1">Cover</p>
        <div className="w-[calc(50%-8px)] rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <CoverCanvas
            cover={project.cover}
            skuSlug={project.skuSlug}
            onClick={onCoverTap}
          />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 font-medium uppercase mb-2 px-1">
        Pages ({project.pages.length})
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pageIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2">
            {project.pages.map((page, idx) => (
              <SortablePageThumb
                key={page.id}
                page={page}
                index={idx}
                skuSlug={project.skuSlug}
                onRemove={() => onRemovePage(page.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Sortable thumbnail ─────────────────────────────────── */

function SortablePageThumb({
  page, index, skuSlug, onRemove,
}: {
  page: BookPage;
  index: number;
  skuSlug: string | null | undefined;
  onRemove: () => void;
}) {
  const isLocked = !!page.locked;
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: page.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isLocked ? {} : attributes)}
      {...(isLocked ? {} : listeners)}
      className="relative group"
    >
      <div className={`rounded-lg overflow-hidden shadow-sm border ${isLocked ? 'border-gray-300' : 'border-gray-200'}`}>
        <PageCanvas page={page} skuSlug={skuSlug} compact />
      </div>
      <span className="absolute bottom-1 left-1 text-[9px] font-mono text-gray-400 bg-white/80 rounded px-1">
        {index + 1}
      </span>
      {isLocked ? (
        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center">
          <Lock size={10} className="text-gray-500" />
        </span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Trash2 size={10} className="text-red-500" />
        </button>
      )}
    </div>
  );
}
