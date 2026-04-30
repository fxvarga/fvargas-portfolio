import type { ThemeName } from '@/types';

export interface ThemeColors {
  background: string;
  panel: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  text: string;
  muted: string;
  accent: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  Neutral: {
    background: '#FBF8F4',
    panel: '#FFFFFF',
    primary: '#8FB996',
    primaryLight: '#EDF5EF',
    secondary: '#C4816B',
    secondaryLight: '#FBF0EB',
    text: '#3D2C2E',
    muted: '#8B7E7F',
    accent: '#EDE8E3',
  },
  'Soft Pastel': {
    background: '#FFF6F9',
    panel: '#FFFFFF',
    primary: '#E8A0BF',
    primaryLight: '#FDF0F5',
    secondary: '#B8A9D4',
    secondaryLight: '#F3EFF8',
    text: '#3D2C2E',
    muted: '#9B8E8F',
    accent: '#F5EDF1',
  },
  Playful: {
    background: '#FFFAF0',
    panel: '#FFFFFF',
    primary: '#E8A44A',
    primaryLight: '#FFF5E6',
    secondary: '#7FB5A0',
    secondaryLight: '#EDF7F3',
    text: '#3D2C2E',
    muted: '#8B7E7F',
    accent: '#F5EDE3',
  },
};

export function applyTheme(themeName: ThemeName): void {
  const theme = themes[themeName];
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${camelToKebab(key)}`, value);
  });
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
