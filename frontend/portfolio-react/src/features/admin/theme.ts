/**
 * Custom admin theme — extends Fluent UI v9's webLightTheme
 * with refined typography, warmer neutrals, and an elevated look.
 */
import { createLightTheme, createDarkTheme, type BrandVariants } from '@fluentui/react-components';

// Refined brand palette — a deep slate-blue that feels modern and professional
const adminBrand: BrandVariants = {
  10: '#020305',
  20: '#111723',
  30: '#18243B',
  40: '#1E304E',
  50: '#243D62',
  60: '#2B4A77',
  70: '#32588C',
  80: '#3A66A2',
  90: '#4B78B2',
  100: '#5E8ABF',
  110: '#729CCC',
  120: '#87AED8',
  130: '#9DC0E3',
  140: '#B4D2ED',
  150: '#CCE3F5',
  160: '#E5F2FC',
};

export const adminTheme = {
  ...createLightTheme(adminBrand),

  // ── Background tones ──
  // A slightly warmer, softer canvas than stock Fluent
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: '#f8f9fb',
  colorNeutralBackground3: '#f1f3f6',
  colorNeutralBackground4: '#e8ebf0',

  // ── Typography ──
  // Inter for a crisper admin feel; fall back gracefully
  fontFamilyBase:
    "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif",
  // Tighten base line-height for denser, more editorial layouts
  lineHeightBase200: '1.4',
  lineHeightBase300: '1.5',
  lineHeightBase400: '1.5',

  // ── Stroke / border refinements ──
  colorNeutralStroke1: '#e0e4ea',
  colorNeutralStroke2: '#eaecf0',

  // ── Subtle foreground tones for better hierarchy ──
  colorNeutralForeground3: '#8892a4',
  colorNeutralForeground4: '#a0a8b8',

  // ── Shadows — softer, more diffused, with subtle blue tint ──
  shadow2: '0 1px 2px rgba(16, 24, 40, 0.04)',
  shadow4: '0 2px 8px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.03)',
  shadow8: '0 4px 16px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.03)',
  shadow16: '0 8px 24px rgba(16, 24, 40, 0.10), 0 4px 8px rgba(16, 24, 40, 0.04)',
  shadow28: '0 12px 40px rgba(16, 24, 40, 0.12), 0 4px 12px rgba(16, 24, 40, 0.04)',

  // ── Border radius — slightly rounder for modern feel ──
  borderRadiusMedium: '8px',
  borderRadiusLarge: '12px',
  borderRadiusXLarge: '16px',

  // ── Spacing tweaks ──
  spacingHorizontalXXL: '32px',
  spacingVerticalXXL: '32px',
};

/**
 * Dark sidebar theme — used inside the NavDrawer so Fluent internals
 * (NavItem, Dropdown, Spinner, etc.) render with light-on-dark colors.
 */
export const sidebarDarkTheme = {
  ...createDarkTheme(adminBrand),

  // Match the exact sidebar background so nothing looks out of place
  colorNeutralBackground1: '#1b2332',
  colorNeutralBackground2: '#1b2332',
  colorNeutralBackground3: '#222d40',
  colorNeutralBackground4: '#283650',

  // Subtle strokes for dividers inside the sidebar
  colorNeutralStroke1: 'rgba(255, 255, 255, 0.10)',
  colorNeutralStroke2: 'rgba(255, 255, 255, 0.06)',

  // Ensure text renders white-ish with clear hierarchy
  colorNeutralForeground1: 'rgba(255, 255, 255, 0.92)',
  colorNeutralForeground2: 'rgba(255, 255, 255, 0.68)',
  colorNeutralForeground3: 'rgba(255, 255, 255, 0.45)',
  colorNeutralForeground4: 'rgba(255, 255, 255, 0.30)',

  // Font family consistency
  fontFamilyBase:
    "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif",

  // Softer radius
  borderRadiusMedium: '8px',
  borderRadiusLarge: '12px',
};
