import { useEffect } from 'react';
import { applyTheme } from '@/lib/themes';
import type { ThemeName } from '@/types';

export function useTheme(themeName: ThemeName) {
  useEffect(() => {
    applyTheme(themeName);
  }, [themeName]);
}
