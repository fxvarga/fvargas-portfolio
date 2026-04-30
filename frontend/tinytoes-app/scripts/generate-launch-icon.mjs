/**
 * Generate a white-on-transparent footprint icon for the iOS launch screen.
 * Outputs 200px (1x), 400px (2x), 600px (3x) into the LaunchIcon.imageset.
 */
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', '..', '..', 'ios', 'TinyToes', 'TinyToes', 'Assets.xcassets', 'LaunchIcon.imageset');

const createFootprintSvg = (size) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const f = s / 512;

  const padCx = cx;
  const padCy = cy + 35 * f;
  const padRx = 62 * f;
  const padRy = 85 * f;

  const toes = [
    { cx: cx - 72 * f, cy: cy - 68 * f, r: 19 * f },
    { cx: cx - 38 * f, cy: cy - 88 * f, r: 17 * f },
    { cx: cx +  2 * f, cy: cy - 94 * f, r: 16 * f },
    { cx: cx + 40 * f, cy: cy - 84 * f, r: 14 * f },
    { cx: cx + 70 * f, cy: cy - 66 * f, r: 12 * f },
  ];

  const toeSvg = toes.map(t =>
    `<circle cx="${t.cx}" cy="${t.cy}" r="${t.r}" fill="white"/>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <ellipse cx="${padCx}" cy="${padCy}" rx="${padRx}" ry="${padRy}" fill="white"/>
  ${toeSvg}
</svg>`;
};

const scales = [
  { name: 'LaunchIcon.png',    size: 200 },
  { name: 'LaunchIcon@2x.png', size: 400 },
  { name: 'LaunchIcon@3x.png', size: 600 },
];

for (const { name, size } of scales) {
  const svgPath = resolve(OUT_DIR, `_tmp_${size}.svg`);
  const pngPath = resolve(OUT_DIR, name);
  writeFileSync(svgPath, createFootprintSvg(size), 'utf-8');
  execSync(`npx sharp-cli -i "${svgPath}" -o "${pngPath}" -- resize ${size} ${size}`, {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..')
  });
  try { unlinkSync(svgPath); } catch {}
  console.log(`Created ${name} (${size}x${size})`);
}

console.log('Done! Launch icons generated.');
