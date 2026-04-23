import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Theme Context
// ---------------------------------------------------------------------------
// Manages dark/light mode and custom color overrides. Colors are applied as
// CSS custom properties on <html> so they flow through Tailwind automatically.
// Everything persists to localStorage. The export system reads this context to
// bake colors + dark mode into the static bundle.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'brad-portfolio-theme-v1';

/** Which CSS custom properties can be customized */
export interface ColorOverrides {
  '--color-primary'?: string;
  '--color-primary-hover'?: string;
  '--color-primary-light'?: string;
  '--color-primary--dark'?: string;
  '--color-primary-hover--dark'?: string;
  '--color-primary-light--dark'?: string;
  '--color-bg'?: string;
  '--color-bg-alt'?: string;
  '--color-text'?: string;
  '--color-text-muted'?: string;
  '--color-border'?: string;
  // Dark mode variants
  '--color-bg--dark'?: string;
  '--color-bg-alt--dark'?: string;
  '--color-text--dark'?: string;
  '--color-text-muted--dark'?: string;
  '--color-border--dark'?: string;
}

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  colors: ColorOverrides;
}

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  colors: ColorOverrides;
  setColor: (key: keyof ColorOverrides, value: string) => void;
  resetColors: () => void;
  /** Full state for export */
  themeState: ThemeState;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
  colors: {},
  setColor: () => {},
  resetColors: () => {},
  themeState: { mode: 'light', colors: {} },
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Convert hex color (#rrggbb) → "R G B" string for CSS custom properties.
 */
export function hexToRgbString(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Convert "R G B" string → #rrggbb hex.
 */
export function rgbStringToHex(rgb: string): string {
  const parts = rgb.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '#000000';
  return '#' + parts.map((n) => n.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return (JSON.parse(stored) as ThemeState).mode || 'light';
    } catch { /* noop */ }
    return 'light';
  });

  const [colors, setColors] = useState<ColorOverrides>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return (JSON.parse(stored) as ThemeState).colors || {};
    } catch { /* noop */ }
    return {};
  });

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  // Apply color overrides as inline CSS custom properties on <html>
  useEffect(() => {
    const root = document.documentElement;
    const isDark = mode === 'dark';

    // Clear any previously set overrides
    const allKeys: (keyof ColorOverrides)[] = [
      '--color-primary', '--color-primary-hover', '--color-primary-light',
      '--color-primary--dark', '--color-primary-hover--dark', '--color-primary-light--dark',
      '--color-bg', '--color-bg-alt', '--color-text', '--color-text-muted', '--color-border',
      '--color-bg--dark', '--color-bg-alt--dark', '--color-text--dark', '--color-text-muted--dark', '--color-border--dark',
    ];
    for (const key of allKeys) {
      if (!key.endsWith('--dark')) {
        root.style.removeProperty(key);
      }
    }

    // Apply light-mode color overrides (always, they're the :root defaults)
    for (const [key, value] of Object.entries(colors)) {
      if (!key.endsWith('--dark') && value) {
        root.style.setProperty(key, value);
      }
    }

    // In dark mode, apply dark overrides on top
    if (isDark) {
      for (const [key, value] of Object.entries(colors)) {
        if (key.endsWith('--dark') && value) {
          const baseKey = key.replace('--dark', '');
          root.style.setProperty(baseKey, value);
        }
      }
    }
  }, [colors, mode]);

  // Persist
  useEffect(() => {
    try {
      const state: ThemeState = { mode, colors };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* noop */ }
  }, [mode, colors]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggleMode = useCallback(() => setModeState((m) => (m === 'light' ? 'dark' : 'light')), []);

  const setColor = useCallback((key: keyof ColorOverrides, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetColors = useCallback(() => {
    setColors({});
    // Clear inline styles
    const root = document.documentElement;
    const allKeys = [
      '--color-primary', '--color-primary-hover', '--color-primary-light',
      '--color-bg', '--color-bg-alt', '--color-text', '--color-text-muted', '--color-border',
    ];
    for (const key of allKeys) root.style.removeProperty(key);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        colors,
        setColor,
        resetColors,
        themeState: { mode, colors },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
