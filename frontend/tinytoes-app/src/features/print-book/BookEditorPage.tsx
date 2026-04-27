import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookProjects } from '@/hooks/useBookProjects';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones } from '@/hooks/useMilestones';
import { useJournal } from '@/hooks/useJournal';
// PageShell removed — editor uses fixed viewport layout
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  PICKABLE_TEMPLATES, createEmptyPage, getTemplateInfo,
} from './PageTemplates';
import { SpreadView, type SpreadSlotTapEvent } from './SpreadView';
import { ArrangePagesView } from './ArrangePagesView';
import { PhotosSheet } from './sheets/PhotosSheet';
import { LayoutsSheet } from './sheets/LayoutsSheet';
import { TextSheet } from './sheets/TextSheet';
import { StatsSheet, type StatsUpdate } from './sheets/StatsSheet';
import type {
  BookProject, BookPage, PageTemplateId, PageContentItem, ImageOffset,
  FoodEntry, Milestone, JournalEntry, PrintProductSlug,
} from '@/types';
import { REACTIONS, MILESTONE_CATEGORIES, getJournalImages, journalEntryDateMs } from '@/types';
import {
  ArrowLeft, Plus, Image as ImageIcon, LayoutGrid, Lightbulb, Droplets,
  ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Copy,
} from 'lucide-react';

/* ── Content item builder helpers ────────────────────────── */

function foodToContentItem(entry: FoodEntry): PageContentItem {
  const label = REACTIONS.find(r => r.key === entry.reaction)?.label ?? '';
  return {
    sourceType: 'food',
    sourceId: entry.id,
    image: entry.image,
    title: entry.food,
    subtitle: `${label} - ${new Date(entry.createdAt).toLocaleDateString()}`,
    text: entry.notes,
  };
}

function milestoneToContentItem(m: Milestone): PageContentItem {
  const cat = MILESTONE_CATEGORIES.find(c => c.value === m.category)?.label ?? '';
  return {
    sourceType: 'milestone',
    sourceId: m.id,
    image: m.image,
    title: m.title,
    subtitle: `${cat} - ${new Date(m.achievedAt).toLocaleDateString()}`,
    text: m.notes,
  };
}

function journalToContentItems(j: JournalEntry): PageContentItem[] {
  const imgs = getJournalImages(j);
  const baseText = j.text + (j.highlights.length ? '\n\nHighlights: ' + j.highlights.join(', ') : '');
  if (imgs.length === 0) {
    return [{
      sourceType: 'journal',
      sourceId: j.id,
      image: null,
      title: j.monthLabel,
      subtitle: j.monthKey,
      text: baseText,
    }];
  }
  return imgs.map((img, idx) => ({
    sourceType: 'journal',
    sourceId: imgs.length > 1 ? `${j.id}#${idx}` : j.id,
    image: img,
    title: j.monthLabel,
    subtitle: imgs.length > 1 ? `${j.monthKey} (${idx + 1}/${imgs.length})` : j.monthKey,
    text: baseText,
  }));
}

/* ── View modes ──────────────────────────────────────────── */

type ViewMode = 'spread' | 'page' | 'arrange';

/* ── BookEditor Page (NEW) ───────────────────────────────── */

export function BookEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, addPage, removePage, reorderPages } = useBookProjects();
  const { profile } = useProfile();
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { entries: journalEntries } = useJournal();

  const [project, setProject] = useState<BookProject | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('spread');
  const [spreadIndex, setSpreadIndex] = useState(0);

  // Sheet states
  const [showPhotos, setShowPhotos] = useState(false);
  const [showLayouts, setShowLayouts] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Active editing target
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  useEffect(() => {
    const found = projects.find(p => p.id === projectId);
    if (found) setProject(found);
  }, [projects, projectId]);

  // Content items (with dateMs for chronological sorting)
  const allContentItems = useMemo(() => {
    const items: (PageContentItem & { key: string; dateMs: number })[] = [];
    for (const e of entries) items.push({ ...foodToContentItem(e), key: `food-${e.id}`, dateMs: e.createdAt });
    for (const m of milestones) items.push({ ...milestoneToContentItem(m), key: `milestone-${m.id}`, dateMs: m.achievedAt });
    for (const j of journalEntries) {
      const dateMs = journalEntryDateMs(j);
      const jItems = journalToContentItems(j);
      for (const it of jItems) {
        items.push({ ...it, key: `${it.sourceType}-${it.sourceId}`, dateMs });
      }
    }
    return items;
  }, [entries, milestones, journalEntries]);

  const usedSourceIds = useMemo(() => {
    if (!project) return new Set<string>();
    const ids = new Set<string>();
    for (const page of project.pages) {
      for (const item of page.items) {
        ids.add(`${item.sourceType}-${item.sourceId}`);
      }
    }
    return ids;
  }, [project]);

  // Helpers
  const getActivePage = useCallback((): BookPage | null => {
    if (!project || !activePageId) return null;
    return project.pages.find(p => p.id === activePageId) ?? null;
  }, [project, activePageId]);

  // Handler: slot tapped on spread
  const handleSlotTap = useCallback((e: SpreadSlotTapEvent) => {
    if (!project) return;
    const tappedPage = project.pages.find(p => p.id === e.pageId);
    if (!tappedPage || tappedPage.locked) return; // No editing on locked pages
    setActivePageId(e.pageId);
    setActiveSlotIndex(e.slotIndex);
    // Title page → dedicated stats editor
    if (tappedPage.templateId === 'title-stats') {
      setShowStats(true);
      return;
    }
    if (e.slotKind === 'image') {
      setShowPhotos(true);
    } else {
      setShowText(true);
    }
  }, [project]);

  // Handler: persist image-offset (drag-to-pan) for a slot
  const handleImageOffsetChange = useCallback(async (pageId: string, slotIndex: number, offset: ImageOffset) => {
    if (!project) return;
    const page = project.pages.find(p => p.id === pageId);
    if (!page || page.locked) return;
    const item = page.items[slotIndex];
    if (!item) return;
    const newItems = [...page.items];
    newItems[slotIndex] = { ...item, imageOffset: offset };
    const updated = { ...page, items: newItems };
    await updateProject({ ...project, pages: project.pages.map(p => p.id === pageId ? updated : p) });
  }, [project, updateProject]);

  // Handler: select a photo from the photos sheet
  const handlePhotoSelect = useCallback(async (item: PageContentItem) => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page) return;
    const template = getTemplateInfo(page.templateId);

    // Replace existing item at slot index, or add if slot is empty
    const newItems = [...page.items];
    if (activeSlotIndex < newItems.length) {
      newItems[activeSlotIndex] = item;
    } else if (newItems.length < template.maxItems) {
      // Fill slots up to the target index
      while (newItems.length < activeSlotIndex) {
        newItems.push({ sourceType: 'custom', sourceId: `empty-${Date.now()}`, image: null, title: '', subtitle: '', text: '' });
      }
      newItems.push(item);
    }

    const updated = { ...page, items: newItems };
    await updateProject({ ...project, pages: project.pages.map(p => p.id === activePageId ? updated : p) });
    setShowPhotos(false);
  }, [project, activePageId, activeSlotIndex, updateProject]);

  // Handler: autofill empty slots across all pages (chronological — oldest first)
  const handleAutofill = useCallback(async () => {
    if (!project) return;
    const unusedItems = allContentItems
      .filter(i => !usedSourceIds.has(i.key) && i.image)
      .sort((a, b) => a.dateMs - b.dateMs);
    let idx = 0;
    const newPages = project.pages.map(page => {
      if (page.locked) return page;
      const template = getTemplateInfo(page.templateId);
      const newItems = [...page.items];
      while (newItems.length < template.maxItems && idx < unusedItems.length) {
        newItems.push(unusedItems[idx++]);
      }
      return { ...page, items: newItems };
    });
    await updateProject({ ...project, pages: newPages });
    setShowPhotos(false);
  }, [project, allContentItems, usedSourceIds, updateProject]);

  // Handler: text save
  const handleTextSave = useCallback(async (updates: { heading?: string; title?: string; text?: string }) => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page) return;

    let newPage = { ...page };
    if (updates.heading !== undefined) newPage.heading = updates.heading;

    const newItems = [...newPage.items];
    if (newItems.length === 0) {
      // Create a custom item for text-only pages
      newItems.push({
        sourceType: 'custom',
        sourceId: `custom-${Date.now()}`,
        image: null,
        title: updates.title ?? '',
        subtitle: '',
        text: updates.text ?? '',
      });
    } else {
      const item = { ...newItems[activeSlotIndex] ?? newItems[0] };
      if (updates.title !== undefined) item.title = updates.title;
      if (updates.text !== undefined) item.text = updates.text;
      newItems[activeSlotIndex < newItems.length ? activeSlotIndex : 0] = item;
    }
    newPage.items = newItems;

    await updateProject({ ...project, pages: project.pages.map(p => p.id === activePageId ? newPage : p) });
  }, [project, activePageId, activeSlotIndex, updateProject]);

  // Handler: stats save (title-stats template)
  const handleStatsSave = useCallback(async (updates: StatsUpdate) => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page) return;
    const newPage: BookPage = {
      ...page,
      heading: updates.heading ?? page.heading,
      stats: updates.stats ?? page.stats,
    };
    await updateProject({ ...project, pages: project.pages.map(p => p.id === activePageId ? newPage : p) });
  }, [project, activePageId, updateProject]);

  // Handler: change layout of active page
  const handleChangeLayout = useCallback(async (templateId: PageTemplateId) => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page) return;
    const template = getTemplateInfo(templateId);
    const clampedItems = page.items.slice(0, template.maxItems);
    const updated = { ...page, templateId, items: clampedItems };
    await updateProject({ ...project, pages: project.pages.map(p => p.id === activePageId ? updated : p) });
  }, [project, activePageId, updateProject]);

  // Handler: add empty page
  const handleAddEmptyPage = useCallback(async (templateId: PageTemplateId) => {
    if (!projectId) return;
    const page = createEmptyPage(templateId);
    await addPage(projectId, page);
    setShowTemplatePicker(false);
    // Navigate to the spread containing the new page (last page).
    // Spread 0 = cover, Spread N (N>=1) = pages[(N-1)*2..(N-1)*2+1]
    if (project) {
      const newPageCount = project.pages.length + 1;
      const newSpread = 1 + Math.floor((newPageCount - 1) / 2);
      setSpreadIndex(newSpread);
    }
  }, [projectId, project, addPage]);

  // Handler: reorder pages
  const handleReorder = useCallback(async (orderedIds: string[]) => {
    if (!project) return;
    await reorderPages(project.id, orderedIds);
  }, [project, reorderPages]);

  // Handler: remove page
  const handleRemovePage = useCallback(async (pageId: string) => {
    if (!projectId) return;
    await removePage(projectId, pageId);
  }, [projectId, removePage]);

  // Handler: delete the currently-active page (from More menu)
  const handleDeleteCurrentPage = useCallback(async () => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page || page.locked) return;
    setShowMoreMenu(false);
    await removePage(project.id, activePageId);
    // Step back if we ran off the end
    const newPageCount = project.pages.length - 1;
    const maxSpread = newPageCount === 0 ? 0 : Math.ceil(newPageCount / 2);
    if (spreadIndex > maxSpread) setSpreadIndex(maxSpread);
  }, [project, activePageId, removePage, spreadIndex]);

  // Handler: duplicate the currently-active page (from More menu)
  const handleDuplicateCurrentPage = useCallback(async () => {
    if (!project || !activePageId) return;
    const page = project.pages.find(p => p.id === activePageId);
    if (!page || page.locked) return;
    setShowMoreMenu(false);
    const dup = createEmptyPage(page.templateId, {
      heading: page.heading,
      decoration: page.decoration,
    });
    // Deep-copy items + stats
    dup.items = page.items.map(it => ({ ...it, imageOffset: it.imageOffset ? { ...it.imageOffset } : undefined }));
    if (page.stats) dup.stats = { ...page.stats };
    await addPage(project.id, dup);
  }, [project, activePageId, addPage]);

  // Handler: update cover (and optionally SKU)
  const handleUpdateCover = useCallback(async (coverUpdates: Partial<BookProject['cover']>, skuSlug?: BookProject['skuSlug']) => {
    if (!project) return;
    const next: BookProject = {
      ...project,
      cover: { ...project.cover, ...coverUpdates },
      ...(skuSlug !== undefined ? { skuSlug } : {}),
    };
    await updateProject(next);
    setShowCoverEditor(false);
  }, [project, updateProject]);

  // Determine active page from current spread for the layouts/text sheet
  useEffect(() => {
    if (!project || viewMode !== 'spread') return;
    // Spread 0 = cover (no active page).
    // Spread N (N>=1) = pages[(N-1)*2] (left) + pages[(N-1)*2+1] (right)
    if (spreadIndex === 0) {
      setActivePageId(null);
      return;
    }
    const leftIdx = (spreadIndex - 1) * 2;
    const rightIdx = leftIdx + 1;
    setActivePageId(project.pages[rightIdx]?.id ?? project.pages[leftIdx]?.id ?? null);
  }, [spreadIndex, project, viewMode]);

  if (!project) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const totalSpreads = 1 + Math.max(1, Math.ceil(project.pages.length / 2));
  const activePage = project.pages.find(p => p.id === activePageId) ?? null;
  const canMutateActivePage = !!activePage && !activePage.locked;

  return (
    <>
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => navigate('/memory-book')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold text-gray-800 truncate max-w-[50%]">{project.name}</h1>
          <span className="text-xs text-gray-400 font-mono">{project.pages.length} pg</span>
        </div>

        {/* ── View mode toggle ────────────────────── */}
        <div className="flex items-center justify-center gap-1 py-2 bg-white border-b border-gray-100 shrink-0">
          {(['spread', 'page', 'arrange'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {mode === 'spread' ? 'Spread view' : mode === 'page' ? 'Page view' : 'Arrange pages'}
            </button>
          ))}
        </div>

        {/* ── Main content area ───────────────────── */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-2 overflow-hidden">
          {viewMode === 'spread' && (
            <SpreadView
              project={project}
              editable
              activePageId={activePageId}
              activeSlotIndex={activeSlotIndex}
              onSlotTap={handleSlotTap}
              onImageOffsetChange={handleImageOffsetChange}
              onCoverTap={() => setShowCoverEditor(true)}
              spreadIndex={spreadIndex}
              onSpreadChange={setSpreadIndex}
            />
          )}

          {viewMode === 'page' && (
            <PageViewSingle
              project={project}
              activePageId={activePageId}
              activeSlotIndex={activeSlotIndex}
              onSlotTap={handleSlotTap}
              onImageOffsetChange={handleImageOffsetChange}
              onCoverTap={() => setShowCoverEditor(true)}
              spreadIndex={spreadIndex}
              onSpreadChange={setSpreadIndex}
            />
          )}

          {viewMode === 'arrange' && (
            <div className="w-full h-full overflow-y-auto py-2">
              <ArrangePagesView
                project={project}
                onReorder={handleReorder}
                onRemovePage={handleRemovePage}
                onCoverTap={() => setShowCoverEditor(true)}
              />
            </div>
          )}
        </div>

        {/* ── Bottom toolbar (contextual tabs) ────── */}
        {viewMode !== 'arrange' && (
          <div className="flex items-center justify-around bg-white border-t border-gray-100 py-2 shrink-0">
            <ToolbarBtn icon={ImageIcon} label="Photos" active={showPhotos} onClick={() => setShowPhotos(true)} />
            <ToolbarBtn icon={LayoutGrid} label="Layouts" active={showLayouts} onClick={() => { setShowLayouts(true); }} />
            <ToolbarBtn icon={Lightbulb} label="Idea pages" onClick={() => setShowTemplatePicker(true)} />
            <ToolbarBtn icon={Droplets} label="Backgrounds" onClick={() => {}} disabled />
          </div>
        )}

        {/* ── Bottom action bar ───────────────────── */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100 shrink-0 pb-[env(safe-area-inset-bottom,8px)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpreadIndex(Math.max(0, spreadIndex - 1))}
              disabled={spreadIndex === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setSpreadIndex(Math.min(totalSpreads - 1, spreadIndex + 1))}
              disabled={spreadIndex >= totalSpreads - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowTemplatePicker(true)}
            className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg"
          >
            <Plus size={20} />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
              {project.pages.length}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(v => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMoreMenu && (
                <>
                  {/* click-away backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 z-50 w-48 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 py-1 overflow-hidden">
                    <MenuItem
                      icon={Copy}
                      label="Duplicate page"
                      disabled={!canMutateActivePage}
                      onClick={handleDuplicateCurrentPage}
                    />
                    <MenuItem
                      icon={Trash2}
                      label="Delete page"
                      destructive
                      disabled={!canMutateActivePage}
                      onClick={handleDeleteCurrentPage}
                    />
                    {!canMutateActivePage && (
                      <p className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                        {activePage?.locked
                          ? 'This page is locked.'
                          : 'Open a page first (cover can\u2019t be deleted).'}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sheets ────────────────────────────────── */}
      <PhotosSheet
        isOpen={showPhotos}
        onClose={() => setShowPhotos(false)}
        items={allContentItems}
        usedKeys={usedSourceIds}
        onSelect={handlePhotoSelect}
        onAutofill={handleAutofill}
      />

      <LayoutsSheet
        isOpen={showLayouts}
        onClose={() => setShowLayouts(false)}
        currentPage={getActivePage()}
        onChangeLayout={handleChangeLayout}
      />

      <TextSheet
        isOpen={showText}
        onClose={() => setShowText(false)}
        page={getActivePage()}
        itemIndex={activeSlotIndex}
        onSave={handleTextSave}
      />

      <StatsSheet
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        page={getActivePage()}
        onSave={handleStatsSave}
      />

      {/* Template picker (add new page) */}
      <Modal isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} title="Add Page">
        <div className="grid grid-cols-2 gap-3">
          {PICKABLE_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleAddEmptyPage(t.id)}
              className="p-3 rounded-xl border border-gray-200 hover:border-theme-primary transition-colors text-left"
            >
              <t.icon size={20} className="text-theme-primary mb-2" />
              <p className="text-sm font-semibold text-gray-800">{t.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Cover editor modal */}
      <CoverEditorModal
        isOpen={showCoverEditor}
        onClose={() => setShowCoverEditor(false)}
        cover={project.cover}
        skuSlug={project.skuSlug}
        profilePhoto={profile.photo}
        libraryItems={allContentItems}
        onSave={handleUpdateCover}
      />
    </>
  );
}

/* ── Page view (single page, large) ──────────────────────── */

import { PageCanvas } from './PageCanvas';
import { CoverCanvas } from './CoverCanvas';

function PageViewSingle({
  project, activePageId, activeSlotIndex, onSlotTap, onImageOffsetChange,
  onCoverTap, spreadIndex, onSpreadChange,
}: {
  project: BookProject;
  activePageId: string | null;
  activeSlotIndex: number;
  onSlotTap: (e: SpreadSlotTapEvent) => void;
  onImageOffsetChange: (pageId: string, slotIndex: number, offset: ImageOffset) => void;
  onCoverTap: () => void;
  spreadIndex: number;
  onSpreadChange: (idx: number) => void;
}) {
  // Index 0 = cover. Index N (N>=1) = pages[N-1].
  const isCover = spreadIndex === 0;
  const pageIndex = spreadIndex - 1;
  const totalPages = project.pages.length;
  const totalSlides = totalPages + 1;

  const handleSlotTap = (pageId: string) => (e: { slotIndex: number; slotKind: 'image' | 'text' }) => {
    onSlotTap({ ...e, pageId });
  };

  // Swipe
  const touchStart = { current: null as { x: number } | null };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && spreadIndex < totalSlides - 1) onSpreadChange(spreadIndex + 1);
      else if (dx > 0 && spreadIndex > 0) onSpreadChange(spreadIndex - 1);
    }
    touchStart.current = null;
  };

  return (
    <div
      className="flex flex-col items-center w-full max-w-[400px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full shadow-lg rounded-sm overflow-hidden">
        {isCover ? (
          <div className="cursor-pointer" onClick={onCoverTap}>
            <CoverCanvas cover={project.cover} skuSlug={project.skuSlug} />
          </div>
        ) : project.pages[pageIndex] ? (
          <PageCanvas
            page={project.pages[pageIndex]}
            skuSlug={project.skuSlug}
            editable={!project.pages[pageIndex].locked}
            active={project.pages[pageIndex].id === activePageId}
            activeSlotIndex={project.pages[pageIndex].id === activePageId ? activeSlotIndex : undefined}
            onSlotTap={handleSlotTap(project.pages[pageIndex].id)}
            onImageOffsetChange={(slot, offset) => onImageOffsetChange(project.pages[pageIndex].id, slot, offset)}
          />
        ) : (
          <div className="bg-gray-50" style={{ aspectRatio: '2/3' }} />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {isCover ? 'Cover' : `Page ${pageIndex + 1} of ${totalPages}`}
      </p>
    </div>
  );
}

/* ── Toolbar button ──────────────────────────────────────── */

function MenuItem({
  icon: Icon, label, onClick, disabled, destructive,
}: {
  icon: typeof ImageIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : destructive
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}function ToolbarBtn({
  icon: Icon, label, active, onClick, disabled,
}: {
  icon: typeof ImageIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
        active ? 'text-theme-primary' : disabled ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

/* ── Cover Editor Modal ──────────────────────────────────── */

const COVER_FORMAT_OPTIONS: { slug: PrintProductSlug; label: string; description: string }[] = [
  { slug: 'print-softcover', label: 'Keepsake Softcover', description: '6x9 perfect-bound' },
  { slug: 'print-hardcover', label: 'Heirloom Hardcover', description: '8.5x8.5 case-wrap' },
  { slug: 'print-premium', label: 'Linen Premium', description: '8.5x11 linen' },
];

function CoverEditorModal({
  isOpen, onClose, cover, skuSlug, profilePhoto, libraryItems, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  cover: BookProject['cover'];
  skuSlug: BookProject['skuSlug'];
  profilePhoto: string | null;
  libraryItems: (PageContentItem & { key: string })[];
  onSave: (updates: Partial<BookProject['cover']>, skuSlug?: BookProject['skuSlug']) => void;
}) {
  const [babyName, setBabyName] = useState(cover.babyName);
  const [year, setYear] = useState(cover.year);
  const [theme, setTheme] = useState(cover.theme);
  const [photo, setPhoto] = useState<string | null>(cover.photo ?? null);
  const [selectedSku, setSelectedSku] = useState<PrintProductSlug>(skuSlug ?? 'print-softcover');

  useEffect(() => {
    setBabyName(cover.babyName);
    setYear(cover.year);
    setTheme(cover.theme);
    setPhoto(cover.photo ?? null);
    setSelectedSku(skuSlug ?? 'print-softcover');
  }, [cover, skuSlug]);

  const themeOptions: { value: typeof theme; label: string; color: string }[] = [
    { value: 'classic', label: 'Classic', color: '#8FB996' },
    { value: 'pastel', label: 'Pastel', color: '#E8A0BF' },
    { value: 'playful', label: 'Playful', color: '#E8A44A' },
  ];

  // Library images (photos from foods/milestones/journal that have an image)
  const libraryPhotos = libraryItems.filter(i => !!i.image);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Cover">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-theme-text block mb-1">Baby Name</label>
          <input
            type="text"
            value={babyName}
            onChange={e => setBabyName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-theme-text block mb-1">Year</label>
          <input
            type="text"
            value={year}
            onChange={e => setYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
          />
        </div>

        {/* Format picker */}
        <div>
          <label className="text-sm font-medium text-theme-text block mb-2">Format</label>
          <div className="space-y-2">
            {COVER_FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.slug}
                onClick={() => setSelectedSku(opt.slug)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${
                  selectedSku === opt.slug ? 'border-theme-primary' : 'border-theme-accent/40'
                }`}
              >
                <div className="flex-1">
                  <p className="text-xs font-semibold text-theme-text">{opt.label}</p>
                  <p className="text-[10px] text-theme-muted">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme picker */}
        <div>
          <label className="text-sm font-medium text-theme-text block mb-2">Cover Theme</label>
          <div className="flex gap-3">
            {themeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                  theme === t.value ? 'border-theme-primary shadow-sm' : 'border-theme-accent/40'
                }`}
              >
                <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: t.color }} />
                <p className="text-[10px] font-medium text-theme-text text-center">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cover photo picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-theme-text">Cover Photo</label>
            {photo && (
              <button
                onClick={() => setPhoto(null)}
                className="text-[10px] text-theme-muted hover:text-red-500 font-medium"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {profilePhoto && (
              <button
                onClick={() => setPhoto(profilePhoto)}
                className={`shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  photo === profilePhoto ? 'border-theme-primary' : 'border-transparent'
                }`}
                title="Profile photo"
              >
                <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] py-0.5 text-center">
                  Profile
                </span>
              </button>
            )}
            {libraryPhotos.map(item => (
              <button
                key={item.key}
                onClick={() => setPhoto(item.image!)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  photo === item.image ? 'border-theme-primary' : 'border-transparent'
                }`}
                title={item.title}
              >
                <img src={item.image!} alt={item.title} className="w-full h-full object-cover" />
              </button>
            ))}
            {!profilePhoto && libraryPhotos.length === 0 && (
              <p className="text-[10px] text-theme-muted py-2">
                No photos available. Add foods, milestones, or journal entries with photos.
              </p>
            )}
          </div>
        </div>

        <Button fullWidth onClick={() => onSave({
          babyName, year, theme, photo,
        }, selectedSku)}>
          Save Cover
        </Button>
      </div>
    </Modal>
  );
}
