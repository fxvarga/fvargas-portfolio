/**
 * Generate PWA icons for TinyToesAndUs
 * Brand: Teal #26C6B5, rounded, baby-friendly feel
 * Icon: A small foot (baby toe) inside a soft circle with the app initial
 *
 * Uses sharp to convert SVG → PNG at 192px and 512px
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_DIR = resolve(__dirname, '..', 'public', 'icons');

if (!existsSync(ICON_DIR)) {
  mkdirSync(ICON_DIR, { recursive: true });
}

// SVG icon design: Rounded teal background with a cute baby footprint
const createSvg = (size) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42; // main circle radius
  const footScale = s / 512; // scale factor relative to 512

  // Baby footprint paths (centered, designed at 512 scale)
  // Main foot pad (oval)
  const padCx = cx;
  const padCy = cy + 30 * footScale;
  const padRx = 58 * footScale;
  const padRy = 80 * footScale;

  // Five little toes as circles, arced above the pad
  const toes = [
    { cx: cx - 68 * footScale, cy: cy - 72 * footScale, r: 18 * footScale },
    { cx: cx - 38 * footScale, cy: cy - 90 * footScale, r: 20 * footScale },
    { cx: cx - 2 * footScale,  cy: cy - 96 * footScale, r: 21 * footScale },
    { cx: cx + 34 * footScale, cy: cy - 86 * footScale, r: 19 * footScale },
    { cx: cx + 62 * footScale, cy: cy - 68 * footScale, r: 16 * footScale },
  ];

  const toeSvg = toes.map(t =>
    `<circle cx="${t.cx}" cy="${t.cy}" r="${t.r}" fill="white" opacity="0.95"/>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="bg" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#3FE0CF"/>
      <stop offset="100%" stop-color="#1BA899"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${2 * footScale}" stdDeviation="${4 * footScale}" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="${cx}" cy="${cx}" r="${r}" fill="url(#bg)"/>

  <!-- Baby footprint -->
  <g filter="url(#shadow)">
    <!-- Main foot pad -->
    <ellipse cx="${padCx}" cy="${padCy}" rx="${padRx}" ry="${padRy}" fill="white" opacity="0.95"/>
    <!-- Toes -->
    ${toeSvg}
  </g>
</svg>`;
};

const sizes = [192, 512];

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

// Clean up SVG intermediates
for (const size of sizes) {
  const svgPath = resolve(ICON_DIR, `icon-${size}.svg`);
  try {
    const { unlinkSync } = await import('fs');
    unlinkSync(svgPath);
  } catch {}
}

console.log('\nDone! PWA icons generated.');
