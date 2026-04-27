import { useCallback, useRef } from 'react';
import type { BookProject, BookPage, ImageOffset } from '@/types';
import { PageCanvas, type SlotTapEvent } from './PageCanvas';
import { CoverCanvas } from './CoverCanvas';

export interface SpreadSlotTapEvent extends SlotTapEvent {
  pageId: string;
}

interface SpreadViewProps {
  project: BookProject;
  editable?: boolean;
  activePageId?: string | null;
  activeSlotIndex?: number;
  onSlotTap?: (e: SpreadSlotTapEvent) => void;
  onImageOffsetChange?: (pageId: string, slotIndex: number, offset: ImageOffset) => void;
  onCoverTap?: () => void;
  /** Currently focused spread index (controlled).
   *  0 = cover (alone)
   *  N>=1 = pages[(N-1)*2] (left) + pages[(N-1)*2+1] (right) */
  spreadIndex: number;
  onSpreadChange: (idx: number) => void;
}

/**
 * Spread view: shows an open-book metaphor.
 * Spread 0 = cover (centered, alone).
 * Spread 1 = pages[0] (left) + pages[1] (right).
 * Spread 2 = pages[2] (left) + pages[3] (right).
 * ...
 */
export function SpreadView({
  project, editable = false, activePageId, activeSlotIndex,
  onSlotTap, onImageOffsetChange, onCoverTap,
  spreadIndex, onSpreadChange,
}: SpreadViewProps) {
  const pages = project.pages;
  const totalSpreads = 1 + Math.max(1, Math.ceil(pages.length / 2));

  const isCoverSpread = spreadIndex === 0;
  const pageSpreadIndex = spreadIndex - 1;

  const getSpreadPages = (idx: number): { left: BookPage | null; right: BookPage | null } => {
    const leftIdx = idx * 2;
    const rightIdx = idx * 2 + 1;
    return {
      left: pages[leftIdx] ?? null,
      right: pages[rightIdx] ?? null,
    };
  };

  const spread = isCoverSpread
    ? { left: null, right: null }
    : getSpreadPages(pageSpreadIndex);

  const goPrev = useCallback(() => {
    if (spreadIndex > 0) onSpreadChange(spreadIndex - 1);
  }, [spreadIndex, onSpreadChange]);

  const goNext = useCallback(() => {
    if (spreadIndex < totalSpreads - 1) onSpreadChange(spreadIndex + 1);
  }, [spreadIndex, totalSpreads, onSpreadChange]);

  // Swipe handling
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  const handleSlotTap = (pageId: string) => (e: SlotTapEvent) => {
    onSlotTap?.({ ...e, pageId });
  };

  const leftPageNum = pageSpreadIndex * 2 + 1;
  const rightPageNum = pageSpreadIndex * 2 + 2;

  return (
    <div className="flex flex-col items-center w-full select-none gap-3">
      {/* Book area */}
      <div
        className="relative w-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isCoverSpread ? (
          /* Cover alone — centered, single-page width */
          <div
            className="shadow-lg rounded-sm overflow-hidden cursor-pointer ring-1 ring-gray-200"
            style={{ width: 'min(50%, 300px)' }}
            onClick={onCoverTap}
          >
            <CoverCanvas cover={project.cover} skuSlug={project.skuSlug} />
          </div>
        ) : (
          /* Open book spread */
          <div className="flex w-full max-w-[600px] shadow-lg rounded-sm overflow-hidden">
            {/* Left page */}
            <div className={`flex-1 min-w-0 border-r border-gray-200 ${spread.left && spread.left.id === activePageId ? 'ring-2 ring-theme-primary ring-inset' : ''}`}>
              {spread.left ? (
                <PageCanvas
                  page={spread.left}
                  skuSlug={project.skuSlug}
                  editable={editable && !spread.left.locked}
                  active={spread.left.id === activePageId}
                  activeSlotIndex={spread.left.id === activePageId ? activeSlotIndex : undefined}
                  onSlotTap={handleSlotTap(spread.left.id)}
                  onImageOffsetChange={onImageOffsetChange ? (slot, offset) => onImageOffsetChange(spread.left!.id, slot, offset) : undefined}
                />
              ) : (
                <div className="bg-gray-50" style={{ aspectRatio: '2/3' }} />
              )}
            </div>

            {/* Spine shadow */}
            <div className="w-[2px] bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shrink-0" />

            {/* Right page */}
            <div className={`flex-1 min-w-0 ${spread.right && spread.right.id === activePageId ? 'ring-2 ring-theme-primary ring-inset' : ''}`}>
              {spread.right ? (
                <PageCanvas
                  page={spread.right}
                  skuSlug={project.skuSlug}
                  editable={editable && !spread.right.locked}
                  active={spread.right.id === activePageId}
                  activeSlotIndex={spread.right.id === activePageId ? activeSlotIndex : undefined}
                  onSlotTap={handleSlotTap(spread.right.id)}
                  onImageOffsetChange={onImageOffsetChange ? (slot, offset) => onImageOffsetChange(spread.right!.id, slot, offset) : undefined}
                />
              ) : (
                <div className="bg-gray-50" style={{ aspectRatio: '2/3' }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Page number / cover indicators */}
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <span className="text-xs text-gray-400 font-mono w-8 text-center">
          {!isCoverSpread && spread.left ? leftPageNum : ''}
        </span>
        <span className="text-[10px] text-gray-400">
          {isCoverSpread ? 'Cover' : `${spreadIndex} / ${totalSpreads - 1}`}
        </span>
        <span className="text-xs text-gray-400 font-mono w-8 text-center">
          {!isCoverSpread && spread.right ? rightPageNum : ''}
        </span>
      </div>
    </div>
  );
}
