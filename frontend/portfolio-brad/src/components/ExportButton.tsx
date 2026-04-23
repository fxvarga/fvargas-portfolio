import { useState } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { useTheme } from '../context/ThemeContext';
import { exportSite } from '../lib/exportSite';

/**
 * Floating download button — visible only in edit mode.
 * Triggers full static HTML + CSS zip export.
 */
export default function ExportButton() {
  const { editMode, overrides } = useEditMode();
  const { themeState } = useTheme();
  const [exporting, setExporting] = useState(false);

  if (!editMode) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSite(overrides, themeState);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed — check the console for details.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      data-editor-ui
      className="fixed bottom-[8.5rem] right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all text-sm font-body font-medium hover:scale-105 active:scale-95 bg-[rgb(var(--color-bg-alt))] text-[rgb(var(--color-text))] border-[rgb(var(--color-border))] disabled:opacity-50 disabled:cursor-wait"
      aria-label="Export site as static HTML"
      title="Download static HTML + CSS zip"
    >
      {/* Lucide Download icon */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {exporting ? 'Exporting...' : 'Export'}
    </button>
  );
}
