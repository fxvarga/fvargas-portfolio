import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { profileDb } from '@/lib/db';
import { applyTheme } from '@/lib/themes';
import type { ThemeName } from '@/types';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'Neutral',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('Neutral');

  useEffect(() => {
    profileDb.get().then(profile => {
      const t = profile?.theme || 'Neutral';
      setThemeState(t);
      applyTheme(t);
    });
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
