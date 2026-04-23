import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookProjects } from '@/hooks/useBookProjects';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones } from '@/hooks/useMilestones';
import { useJournal } from '@/hooks/useJournal';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  PAGE_TEMPLATES, PagePreview, createEmptyPage, createPageFromItem, getTemplateInfo,
} from './PageTemplates';
import type {
  BookProject, BookPage, PageTemplateId, PageContentItem,
  FoodEntry, Milestone, JournalEntry,
} from '@/types';
import { REACTIONS, MILESTONE_CATEGORIES } from '@/types';
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  BookOpen, UtensilsCrossed, Trophy, BookText,
  Layers, PenTool, Image as ImageIcon,
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

function journalToContentItem(j: JournalEntry): PageContentItem {
  return {
    sourceType: 'journal',
    sourceId: j.id,
    image: j.image,
    title: j.monthLabel,
    subtitle: j.monthKey,
    text: j.text + (j.highlights.length ? '\n\nHighlights: ' + j.highlights.join(', ') : ''),
  };
}

/* ── BookEditor Page ─────────────────────────────────────── */

export function BookEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, addPage, removePage, reorderPages } = useBookProjects();
  const { profile } = useProfile();
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { entries: journalEntries } = useJournal();

  const [project, setProject] = useState<BookProject | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showContentBrowser, setShowContentBrowser] = useState(false);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'foods' | 'milestones' | 'journal'>('all');
  const [showCoverEditor, setShowCoverEditor] = useState(false);

  // Load project from hook data
  useEffect(() => {
    const found = projects.find(p => p.id === projectId);
    if (found) setProject(found);
  }, [projects, projectId]);

  // Content items for the browser
  const allContentItems = useMemo(() => {
    const items: (PageContentItem & { key: string })[] = [];
    if (contentFilter === 'all' || contentFilter === 'foods') {
      for (const e of entries) items.push({ ...foodToContentItem(e), key: `food-${e.id}` });
    }
    if (contentFilter === 'all' || contentFilter === 'milestones') {
      for (const m of milestones) items.push({ ...milestoneToContentItem(m), key: `milestone-${m.id}` });
    }
    if (contentFilter === 'all' || contentFilter === 'journal') {
      for (const j of journalEntries) items.push({ ...journalToContentItem(j), key: `journal-${j.id}` });
    }
    return items;
  }, [entries, milestones, journalEntries, contentFilter]);

  // IDs already used in the book
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

  const handleAddEmptyPage = useCallback(async (templateId: PageTemplateId) => {
    if (!projectId) return;
    const page = createEmptyPage(templateId);
    await addPage(projectId, page);
    setShowTemplatePicker(false);
    // Open the appropriate editor for the new page
    setEditingPageId(page.id);
    if (templateId === 'text-only' || templateId === 'month-title') {
      setShowPageEditor(true);
    } else {
      setShowContentBrowser(true);
    }
  }, [projectId, addPage]);

  const handleAddContentItem = useCallback(async (item: PageContentItem) => {
    if (!projectId || !editingPageId || !project) return;
    const page = project.pages.find(p => p.id === editingPageId);
    if (!page) return;
    const template = getTemplateInfo(page.templateId);
    if (page.items.length >= template.maxItems) return;

    const updatedPage: BookPage = { ...page, items: [...page.items, item] };
    const updatedProject = {
      ...project,
      pages: project.pages.map(p => p.id === editingPageId ? updatedPage : p),
    };
    await updateProject(updatedProject);
  }, [projectId, editingPageId, project, updateProject]);

  const handleQuickAddItem = useCallback(async (item: PageContentItem) => {
    if (!projectId) return;
    const page = createPageFromItem(item);
    await addPage(projectId, page);
  }, [projectId, addPage]);

  const handleUpdatePage = useCallback(async (updatedPage: BookPage) => {
    if (!project) return;
    const updatedProject = {
      ...project,
      pages: project.pages.map(p => p.id === updatedPage.id ? updatedPage : p),
    };
    await updateProject(updatedProject);
  }, [project, updateProject]);

  const handlePageClick = useCallback((page: BookPage) => {
    setEditingPageId(page.id);
    // Text-only and month-title open the page editor; others open content browser
    if (page.templateId === 'text-only' || page.templateId === 'month-title' || page.templateId === 'photo-text') {
      setShowPageEditor(true);
    } else {
      setShowContentBrowser(true);
    }
  }, []);

  const handleRemovePage = useCallback(async (pageId: string) => {
    if (!projectId) return;
    await removePage(projectId, pageId);
  }, [projectId, removePage]);

  const handleMovePage = useCallback(async (pageId: string, direction: 'up' | 'down') => {
    if (!project) return;
    const ids = project.pages.map(p => p.id);
    const idx = ids.indexOf(pageId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    await reorderPages(project.id, ids);
  }, [project, reorderPages]);

  const handleUpdateCover = useCallback(async (coverUpdates: Partial<BookProject['cover']>) => {
    if (!project) return;
    await updateProject({ ...project, cover: { ...project.cover, ...coverUpdates } });
    setShowCoverEditor(false);
  }, [project, updateProject]);

  if (!project) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={project.name}
        actions={
          <button
            onClick={() => navigate('/memory-book')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-theme-muted"
          >
            <ArrowLeft size={22} />
          </button>
        }
      />

      <div className="px-4 pb-8 space-y-6">
        {/* Cover preview */}
        <Card padding="md" hoverable onClick={() => setShowCoverEditor(true)}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
              style={{ backgroundColor: project.cover.theme === 'classic' ? '#FBF8F4' : project.cover.theme === 'pastel' ? '#FFF6F9' : '#FFFAF0' }}>
              {project.cover.photo ? (
                <img src={project.cover.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <BookOpen size={24} className="text-theme-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-theme-text">{project.cover.babyName}'s Memory Book</p>
              <p className="text-xs text-theme-muted">First Year {project.cover.year}</p>
              <div className="flex items-center gap-1 mt-1">
                <PenTool size={10} className="text-theme-primary" />
                <span className="text-[10px] text-theme-primary font-medium">Edit cover</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Page count + DPI info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-theme-muted" />
            <span className="text-sm font-medium text-theme-text">
              {project.pages.length} {project.pages.length === 1 ? 'page' : 'pages'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowContentBrowser(true)}>
              <Plus size={14} className="mr-1" /> Add Content
            </Button>
            <Button size="sm" onClick={() => setShowTemplatePicker(true)}>
              <Plus size={14} className="mr-1" /> Add Page
            </Button>
          </div>
        </div>

        {/* Pages list */}
        {project.pages.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No pages yet"
            subtitle="Add pages from templates or browse your memories to build your book."
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowContentBrowser(true)}>
                  Browse Content
                </Button>
                <Button size="sm" onClick={() => setShowTemplatePicker(true)}>
                  Choose Template
                </Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {project.pages.map((page, idx) => (
              <div key={page.id} className="flex gap-3 items-start">
                {/* Reorder + page number */}
                <div className="flex flex-col items-center gap-1 pt-2 shrink-0">
                  <button
                    onClick={() => handleMovePage(page.id, 'up')}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-theme-muted hover:bg-black/5 disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-theme-muted">{idx + 1}</span>
                  <button
                    onClick={() => handleMovePage(page.id, 'down')}
                    disabled={idx === project.pages.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-theme-muted hover:bg-black/5 disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Page preview */}
                <div className="flex-1 min-w-0">
                  <Card padding="sm" hoverable onClick={() => handlePageClick(page)}>
                    <PagePreview page={page} compact />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-medium text-theme-muted">
                        {getTemplateInfo(page.templateId).label}
                        {page.items.length > 0 && ` - ${page.items.length} item${page.items.length > 1 ? 's' : ''}`}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemovePage(page.id); }}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-theme-muted hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template picker modal */}
      <Modal isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} title="Choose Page Template">
        <div className="grid grid-cols-2 gap-3">
          {PAGE_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleAddEmptyPage(t.id)}
              className="p-3 rounded-xl border border-theme-accent/60 hover:border-theme-primary transition-colors text-left"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <t.icon size={20} className="text-theme-primary mb-2" />
              <p className="text-sm font-semibold text-theme-text">{t.label}</p>
              <p className="text-[10px] text-theme-muted mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Content browser modal */}
      <Modal isOpen={showContentBrowser} onClose={() => { setShowContentBrowser(false); setEditingPageId(null); }} title={editingPageId ? 'Add to Page' : 'Add Content to Book'}>
        {/* Filter pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([['all', 'All', null], ['foods', 'Foods', UtensilsCrossed], ['milestones', 'Milestones', Trophy], ['journal', 'Journal', BookText]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setContentFilter(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                contentFilter === val ? 'bg-theme-primary text-white' : 'bg-theme-panel text-theme-text hover:bg-black/5'
              }`}
            >
              {Icon && <Icon size={12} />}
              {label}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {allContentItems.length === 0 ? (
            <p className="text-sm text-theme-muted text-center py-8">No content available for this filter.</p>
          ) : (
            allContentItems.map(item => {
              const isUsed = usedSourceIds.has(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => editingPageId ? handleAddContentItem(item) : handleQuickAddItem(item)}
                  disabled={isUsed && !!editingPageId}
                  className={`w-full flex gap-3 p-3 rounded-xl border transition-colors text-left ${
                    isUsed ? 'opacity-50 border-theme-accent/30' : 'border-theme-accent/60 hover:border-theme-primary'
                  }`}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                      {item.sourceType === 'food' ? <UtensilsCrossed size={16} className="text-theme-muted" /> :
                       item.sourceType === 'milestone' ? <Trophy size={16} className="text-theme-muted" /> :
                       <BookText size={16} className="text-theme-muted" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-theme-text truncate">{item.title}</p>
                    <p className="text-[10px] text-theme-muted">{item.subtitle}</p>
                    {isUsed && <span className="text-[9px] text-theme-primary font-medium">Already in book</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Modal>

      {/* Page editor modal (text editing, content management per page) */}
      {showPageEditor && editingPageId && project && (() => {
        const editingPage = project.pages.find(p => p.id === editingPageId);
        if (!editingPage) return null;
        return (
          <PageEditorModal
            page={editingPage}
            allContentItems={allContentItems}
            usedSourceIds={usedSourceIds}
            contentFilter={contentFilter}
            onContentFilterChange={setContentFilter}
            onSave={async (updated) => {
              await handleUpdatePage(updated);
              setShowPageEditor(false);
              setEditingPageId(null);
            }}
            onClose={() => { setShowPageEditor(false); setEditingPageId(null); }}
          />
        );
      })()}

      {/* Cover editor modal */}
      <CoverEditorModal
        isOpen={showCoverEditor}
        onClose={() => setShowCoverEditor(false)}
        cover={project.cover}
        profilePhoto={profile.photo}
        onSave={handleUpdateCover}
      />
    </PageShell>
  );
}

/* ── Page Editor Modal ────────────────────────────────────── */

function PageEditorModal({
  page, allContentItems, usedSourceIds, contentFilter, onContentFilterChange, onSave, onClose,
}: {
  page: BookPage;
  allContentItems: (PageContentItem & { key: string })[];
  usedSourceIds: Set<string>;
  contentFilter: 'all' | 'foods' | 'milestones' | 'journal';
  onContentFilterChange: (f: 'all' | 'foods' | 'milestones' | 'journal') => void;
  onSave: (page: BookPage) => void;
  onClose: () => void;
}) {
  const template = getTemplateInfo(page.templateId);
  const [heading, setHeading] = useState(page.heading ?? '');
  const [items, setItems] = useState<PageContentItem[]>([...page.items]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const isTextTemplate = page.templateId === 'text-only';
  const isMonthTitle = page.templateId === 'month-title';
  const isPhotoText = page.templateId === 'photo-text';

  const handleSave = () => {
    onSave({ ...page, heading: heading || undefined, items });
  };

  const handleAddItem = (item: PageContentItem) => {
    if (items.length < template.maxItems) {
      setItems([...items, item]);
    }
    setShowBrowser(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItemText = (idx: number, field: 'title' | 'text', value: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // For text-only pages with no items, show a custom text item
  if (isTextTemplate && items.length === 0 && editingItemIdx === null) {
    // Auto-create a custom item placeholder
    const customItem: PageContentItem = {
      sourceType: 'custom',
      sourceId: `custom-${Date.now()}`,
      image: null,
      title: '',
      subtitle: '',
      text: '',
    };
    setItems([customItem]);
    setEditingItemIdx(0);
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit ${template.label} Page`}>
      <div className="space-y-4">
        {/* Heading field for text-only and month-title */}
        {(isTextTemplate || isMonthTitle) && (
          <div>
            <label className="text-sm font-medium text-theme-text block mb-1">
              {isMonthTitle ? 'Month Title' : 'Heading'}
            </label>
            <input
              type="text"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              placeholder={isMonthTitle ? 'e.g. Month 3' : 'Page heading'}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
          </div>
        )}

        {/* Text body for text-only pages */}
        {isTextTemplate && items.length > 0 && (
          <div>
            <label className="text-sm font-medium text-theme-text block mb-1">Title</label>
            <input
              type="text"
              value={items[0]?.title ?? ''}
              onChange={e => handleUpdateItemText(0, 'title', e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
            <label className="text-sm font-medium text-theme-text block mb-1 mt-3">Body Text</label>
            <textarea
              value={items[0]?.text ?? ''}
              onChange={e => handleUpdateItemText(0, 'text', e.target.value)}
              placeholder="Write your text here..."
              rows={6}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text resize-none"
            />
          </div>
        )}

        {/* Content items for photo-text, month-title */}
        {!isTextTemplate && (
          <div className="space-y-3">
            {items.length > 0 && (
              <div>
                <label className="text-sm font-medium text-theme-text block mb-2">Content</label>
                {items.map((item, idx) => (
                  <div key={idx} className="border border-theme-accent/40 rounded-xl p-3 space-y-2 mb-2">
                    <div className="flex items-start gap-3">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                          <ImageIcon size={16} className="text-theme-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-theme-text truncate">{item.title || 'Untitled'}</p>
                        <p className="text-[10px] text-theme-muted">{item.subtitle}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-theme-muted hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* Editable text fields for photo-text */}
                    {isPhotoText && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => handleUpdateItemText(idx, 'title', e.target.value)}
                          placeholder="Title"
                          className="w-full px-2 py-1.5 rounded-lg border border-theme-accent/40 text-xs bg-transparent text-theme-text"
                        />
                        <textarea
                          value={item.text}
                          onChange={e => handleUpdateItemText(idx, 'text', e.target.value)}
                          placeholder="Add text..."
                          rows={3}
                          className="w-full px-2 py-1.5 rounded-lg border border-theme-accent/40 text-xs bg-transparent text-theme-text resize-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add content button */}
            {items.length < template.maxItems && (
              <Button size="sm" variant="secondary" fullWidth onClick={() => setShowBrowser(true)}>
                <Plus size={14} className="mr-1" />
                {items.length === 0 ? 'Add Content' : 'Replace Content'}
              </Button>
            )}
          </div>
        )}

        {/* Inline content browser */}
        {showBrowser && (
          <div className="border-t border-theme-accent/30 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-theme-muted uppercase">Browse Content</span>
              <button onClick={() => setShowBrowser(false)} className="text-xs text-theme-primary font-medium">Close</button>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {([['all', 'All', null], ['foods', 'Foods', UtensilsCrossed], ['milestones', 'Milestones', Trophy], ['journal', 'Journal', BookText]] as const).map(([val, label, Icon]) => (
                <button
                  key={val}
                  onClick={() => onContentFilterChange(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    contentFilter === val ? 'bg-theme-primary text-white' : 'bg-theme-panel text-theme-text hover:bg-black/5'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {allContentItems.length === 0 ? (
                <p className="text-sm text-theme-muted text-center py-4">No content available.</p>
              ) : (
                allContentItems.map(item => {
                  const isUsed = usedSourceIds.has(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleAddItem(item)}
                      disabled={isUsed}
                      className={`w-full flex gap-3 p-2 rounded-xl border transition-colors text-left ${
                        isUsed ? 'opacity-50 border-theme-accent/30' : 'border-theme-accent/60 hover:border-theme-primary'
                      }`}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                          {item.sourceType === 'food' ? <UtensilsCrossed size={14} className="text-theme-muted" /> :
                           item.sourceType === 'milestone' ? <Trophy size={14} className="text-theme-muted" /> :
                           <BookText size={14} className="text-theme-muted" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-theme-text truncate">{item.title}</p>
                        <p className="text-[10px] text-theme-muted">{item.subtitle}</p>
                        {isUsed && <span className="text-[9px] text-theme-primary font-medium">Already in book</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <Button fullWidth onClick={handleSave}>Save Page</Button>
      </div>
    </Modal>
  );
}

/* ── Cover Editor Modal ──────────────────────────────────── */

function CoverEditorModal({
  isOpen, onClose, cover, profilePhoto, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  cover: BookProject['cover'];
  profilePhoto: string | null;
  onSave: (updates: Partial<BookProject['cover']>) => void;
}) {
  const [babyName, setBabyName] = useState(cover.babyName);
  const [year, setYear] = useState(cover.year);
  const [theme, setTheme] = useState(cover.theme);
  const [useProfilePhoto, setUseProfilePhoto] = useState(!!cover.photo);

  useEffect(() => {
    setBabyName(cover.babyName);
    setYear(cover.year);
    setTheme(cover.theme);
    setUseProfilePhoto(!!cover.photo);
  }, [cover]);

  const themeOptions: { value: typeof theme; label: string; color: string }[] = [
    { value: 'classic', label: 'Classic', color: '#8FB996' },
    { value: 'pastel', label: 'Pastel', color: '#E8A0BF' },
    { value: 'playful', label: 'Playful', color: '#E8A44A' },
  ];

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
        {profilePhoto && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useProfilePhoto}
              onChange={e => setUseProfilePhoto(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-theme-text">Use profile photo on cover</span>
          </label>
        )}
        <Button fullWidth onClick={() => onSave({
          babyName,
          year,
          theme,
          photo: useProfilePhoto ? profilePhoto : null,
        })}>
          Save Cover
        </Button>
      </div>
    </Modal>
  );
}
