import { useRef, useState } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { useTheme, hexToRgbString, rgbStringToHex, type ColorOverrides } from '../context/ThemeContext';

/**
 * Sticky top banner visible only when edit mode is active.
 * Shows: edit status, import/export/reset controls, theme controls (dark/light + color pickers).
 */
export default function EditBanner() {
  const { editMode, hasOverrides, exportEdits, importEdits, resetOverrides } = useEditMode();
  const { mode, toggleMode, colors, setColor, resetColors } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showColors, setShowColors] = useState(false);

  if (!editMode) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importEdits(file);
    } catch {
      alert('Invalid edits.json file');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  /** Resolve current value for a color key — from overrides or computed CSS */
  const getColor = (key: keyof ColorOverrides): string => {
    if (colors[key]) return rgbStringToHex(colors[key]!);
    const computed = getComputedStyle(document.documentElement).getPropertyValue(key.replace('--dark', '')).trim();
    if (computed) return rgbStringToHex(computed);
    return '#000000';
  };

  const handleColorChange = (key: keyof ColorOverrides, hex: string) => {
    setColor(key, hexToRgbString(hex));
  };

  /** Color picker row with preview swatch and clear labels */
  const ColorRow = ({ label, desc, lightKey, darkKey }: { label: string; desc: string; lightKey: keyof ColorOverrides; darkKey?: keyof ColorOverrides }) => (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-neutral-200">{label}</span>
        <span className="text-[10px] text-neutral-500">{desc}</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer" title={`${label} — Light mode`}>
          <input
            type="color"
            value={getColor(lightKey)}
            onChange={(e) => handleColorChange(lightKey, e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-neutral-500 bg-transparent"
          />
          <span>Light</span>
        </label>
        {darkKey && (
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer" title={`${label} — Dark mode`}>
            <input
              type="color"
              value={getColor(darkKey)}
              onChange={(e) => handleColorChange(darkKey, e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-neutral-500 bg-transparent"
            />
            <span>Dark</span>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Invisible backdrop — closes color panel when clicked */}
      {showColors && (
        <div
          data-editor-ui
          className="fixed inset-0 z-[59]"
          onClick={() => setShowColors(false)}
        />
      )}

      <div
        data-editor-ui
        className="fixed top-0 left-0 right-0 z-[60] bg-neutral-900 text-neutral-100 text-sm font-body"
      >
        {/* Main row */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="hidden sm:inline">Editing — click any highlighted text to modify</span>
          <span className="sm:hidden">Edit mode</span>

          <div className="flex items-center gap-3">
            {/* Dark/Light toggle */}
            <button
              onClick={toggleMode}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-600 hover:border-neutral-400 transition-colors"
              title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            >
              {mode === 'light' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
              <span className="text-xs">{mode === 'light' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Colors toggle */}
            <button
              onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-600 hover:border-neutral-400 transition-colors"
              title="Customize colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="10.5" r="2.5" />
                <circle cx="8.5" cy="7.5" r="2.5" />
                <circle cx="6.5" cy="12.5" r="2.5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
              <span className="text-xs">Colors</span>
            </button>

            <span className="text-neutral-600">|</span>

            {/* Import */}
            <label className="cursor-pointer underline hover:no-underline text-xs">
              Import
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            {hasOverrides && (
              <button onClick={exportEdits} className="underline hover:no-underline text-xs">
                Export JSON
              </button>
            )}
            {hasOverrides && (
              <button
                onClick={() => {
                  if (confirm('Reset all text edits? This cannot be undone.')) resetOverrides();
                }}
                className="underline hover:no-underline text-neutral-400 text-xs"
              >
                Reset Text
              </button>
            )}
          </div>
        </div>

        {/* Color panel (expandable) — closes when clicking the backdrop behind it */}
        {showColors && (
          <div className="border-t border-neutral-700 px-4 py-3 bg-neutral-800">
            <div className="flex flex-wrap gap-x-6 gap-y-3 items-start">
              <ColorRow label="Primary" desc="accent color" lightKey="--color-primary" darkKey="--color-primary--dark" />
              <ColorRow label="Background" desc="page bg" lightKey="--color-bg" darkKey="--color-bg--dark" />
              <ColorRow label="Bg Alt" desc="cards, header" lightKey="--color-bg-alt" darkKey="--color-bg-alt--dark" />
              <ColorRow label="Text" desc="body text" lightKey="--color-text" darkKey="--color-text--dark" />
              <ColorRow label="Muted" desc="secondary text" lightKey="--color-text-muted" darkKey="--color-text-muted--dark" />
              <ColorRow label="Border" desc="dividers" lightKey="--color-border" darkKey="--color-border--dark" />

              <button
                onClick={() => {
                  if (confirm('Reset all color customizations to defaults?')) resetColors();
                }}
                className="text-xs underline hover:no-underline text-neutral-400 ml-auto self-center"
              >
                Reset Colors
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
