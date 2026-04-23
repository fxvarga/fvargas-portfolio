import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Edit Mode Context
// ---------------------------------------------------------------------------
// Manages inline-editing state for the portfolio. When edit mode is on, all
// <Editable> wrappers become contentEditable. Overrides are persisted to
// localStorage so edits survive page reloads. The export system reads these
// overrides to bake edited text into the static HTML bundle.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'brad-portfolio-edits-v1';

/** Flat map of content-path → edited string value */
export type Overrides = Record<string, string>;

interface EditModeContextType {
  /** Whether edit mode is currently active */
  editMode: boolean;
  /** Toggle edit mode on/off */
  toggleEditMode: () => void;
  /** All text overrides keyed by content path */
  overrides: Overrides;
  /** Set (or clear) a single override */
  setOverride: (path: string, value: string) => void;
  /** Wipe all overrides and clear localStorage */
  resetOverrides: () => void;
  /** True when at least one override exists */
  hasOverrides: boolean;
  /** Export overrides as a downloadable edits.json file */
  exportEdits: () => void;
  /** Import overrides from a File (edits.json) */
  importEdits: (file: File) => Promise<void>;
}

const EditModeContext = createContext<EditModeContextType>({
  editMode: false,
  toggleEditMode: () => {},
  overrides: {},
  setOverride: () => {},
  resetOverrides: () => {},
  hasOverrides: false,
  exportEdits: () => {},
  importEdits: async () => {},
});

export function useEditMode() {
  return useContext(EditModeContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);

  // Hydrate overrides from localStorage (or from baked-in window global)
  const [overrides, setOverrides] = useState<Overrides>(() => {
    try {
      // Allow exported HTML to bake edits via a global variable
      const baked = (window as unknown as { __BAKED_EDITS__?: Overrides }).__BAKED_EDITS__;
      if (baked && typeof baked === 'object') return baked;

      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist overrides to localStorage on every change
  useEffect(() => {
    try {
      if (Object.keys(overrides).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
      }
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [overrides]);

  const toggleEditMode = useCallback(() => setEditMode((m) => !m), []);

  const setOverride = useCallback((path: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [path]: value }));
  }, []);

  const resetOverrides = useCallback(() => {
    setOverrides({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }, []);

  const hasOverrides = Object.keys(overrides).length > 0;

  // Download current overrides as edits.json
  const exportEdits = useCallback(() => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edits.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [overrides]);

  // Import overrides from an edits.json file
  const importEdits = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as Overrides;
    setOverrides(parsed);
  }, []);

  return (
    <EditModeContext.Provider
      value={{
        editMode,
        toggleEditMode,
        overrides,
        setOverride,
        resetOverrides,
        hasOverrides,
        exportEdits,
        importEdits,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}
