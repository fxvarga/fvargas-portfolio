/**
 * Generate PWA + iOS icons for TinyToesAndUs
 * Brand: Teal gradient, rounded-rect safe for iOS, baby-friendly feel
 * Icon: A cute baby footprint (5 toes!) on a teal rounded-rect background
 *
 * Uses sharp to convert SVG → PNG at 192, 512, and 1024px
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_DIR = resolve(__dirname, '..', 'public', 'icons');
const IOS_ICON_DIR = resolve(__dirname, '..', '..', '..', 'ios', 'TinyToes', 'TinyToes', 'Assets.xcassets', 'AppIcon.appiconset');

if (!existsSync(ICON_DIR)) {
  mkdirSync(ICON_DIR, { recursive: true });
}

/**
 * SVG icon: teal rounded-rect background with a white baby footprint.
 * Designed at a canonical 512px then scaled. The foot has:
 *   - One large oval "sole/ball" pad
 *   - Exactly 5 small circular toes in a natural arc, well-separated
 */
const createSvg = (size) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const f = s / 512; // scale factor

  // Rounded-rect background (iOS-safe, fills the square)
  // For 1024px iOS icon, use rx=0 to avoid alpha channel issues with App Store
  const bgRx = size === 1024 ? 0 : 100 * f; // corner radius

  // Foot sole — slightly shifted down from center
  const padCx = cx;
  const padCy = cy + 35 * f;
  const padRx = 62 * f;
  const padRy = 85 * f;

  // 5 toes — natural arc, big toe on the left (medial side), pinky on right
  // Spaced so they never overlap: gaps ≥ 6px at 512 scale
  const toes = [
    { cx: cx - 72 * f, cy: cy - 68 * f, r: 19 * f },  // big toe
    { cx: cx - 38 * f, cy: cy - 88 * f, r: 17 * f },  // second toe
    { cx: cx +  2 * f, cy: cy - 94 * f, r: 16 * f },  // middle toe
    { cx: cx + 40 * f, cy: cy - 84 * f, r: 14 * f },  // fourth toe
    { cx: cx + 70 * f, cy: cy - 66 * f, r: 12 * f },  // pinky toe
  ];

  const toeSvg = toes.map(t =>
    `<circle cx="${t.cx}" cy="${t.cy}" r="${t.r}" fill="white"/>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3FE0CF"/>
      <stop offset="100%" stop-color="#1BA899"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${2 * f}" stdDeviation="${6 * f}" flood-color="#0D6B5E" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect x="0" y="0" width="${s}" height="${s}" rx="${bgRx}" ry="${bgRx}" fill="url(#bg)"/>

  <!-- Baby footprint -->
  <g filter="url(#shadow)">
    <ellipse cx="${padCx}" cy="${padCy}" rx="${padRx}" ry="${padRy}" fill="white"/>
    ${toeSvg}
  </g>
</svg>`;
};

// Sizes: PWA (192, 512) + iOS App Icon (1024)
const sizes = [192, 512, 1024];

for (const size of sizes) {
  const svgPath = resolve(ICON_DIR, `icon-${size}.svg`);
  const pngPath = resolve(ICON_DIR, `icon-${size}.png`);

  const svg = createSvg(size);
  writeFileSync(svgPath, svg, 'utf-8');
  console.log(`Created SVG: ${svgPath}`);

  // Convert SVG to PNG using sharp-cli
  execSync(`npx sharp-cli -i "${svgPath}" -o "${pngPath}" -- resize ${size} ${size}`, {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..')
  });
  console.log(`Created PNG: ${pngPath} (${size}x${size})`);
}

// Copy 1024px icon to iOS asset catalog
if (existsSync(IOS_ICON_DIR)) {
  const src = resolve(ICON_DIR, 'icon-1024.png');
  const dest = resolve(IOS_ICON_DIR, 'AppIcon.png');
  copyFileSync(src, dest);
  console.log(`Copied 1024px icon → ${dest}`);
}

// Clean up SVG intermediates
for (const size of sizes) {
  const svgPath = resolve(ICON_DIR, `icon-${size}.svg`);
  try { unlinkSync(svgPath); } catch {}
}

console.log('\nDone! PWA + iOS icons generated.');
