import JSZip from 'jszip';
import type { Overrides } from '../context/EditModeContext';
import type { ColorOverrides, ThemeMode } from '../context/ThemeContext';

// ---------------------------------------------------------------------------
// exportSite — generates a static HTML + CSS + JS + images zip of the portfolio
// ---------------------------------------------------------------------------

interface ThemeState {
  mode: ThemeMode;
  colors: ColorOverrides;
}

/** All routes to capture, mapped to output filenames */
const ROUTES: Array<{ path: string; file: string; depth: number }> = [
  { path: '/',                              file: 'index.html',                          depth: 0 },
  { path: '/work',                          file: 'work.html',                           depth: 0 },
  { path: '/work/rothman-mobile',           file: 'work/rothman-mobile.html',            depth: 1 },
  { path: '/work/safensound',               file: 'work/safensound.html',                depth: 1 },
  { path: '/work/ri-analytics-dashboard',   file: 'work/ri-analytics-dashboard.html',    depth: 1 },
  { path: '/process',                       file: 'process.html',                        depth: 0 },
  { path: '/about',                         file: 'about.html',                          depth: 0 },
  { path: '/contact',                       file: 'contact.html',                        depth: 0 },
];

const LINK_REWRITES: Array<{ from: string; toRoot: string; toNested: string }> = [
  { from: '/work/rothman-mobile',         toRoot: 'work/rothman-mobile.html',         toNested: '../work/rothman-mobile.html' },
  { from: '/work/safensound',             toRoot: 'work/safensound.html',             toNested: '../work/safensound.html' },
  { from: '/work/ri-analytics-dashboard', toRoot: 'work/ri-analytics-dashboard.html', toNested: '../work/ri-analytics-dashboard.html' },
  { from: '/work',                        toRoot: 'work.html',                        toNested: '../work.html' },
  { from: '/process',                     toRoot: 'process.html',                     toNested: '../process.html' },
  { from: '/about',                       toRoot: 'about.html',                       toNested: '../about.html' },
  { from: '/contact',                     toRoot: 'contact.html',                     toNested: '../contact.html' },
  { from: '/',                            toRoot: 'index.html',                       toNested: '../index.html' },
];

/** Edit-mode CSS classes to strip */
const EDIT_MODE_CLASSES = [
  'outline-dashed', 'outline-1', 'outline-primary/40',
  'hover:outline-primary/70', 'focus:outline-primary',
  'rounded', 'cursor-text', 'transition-\\[outline\\]',
];
const EDIT_CLASS_REGEX = new RegExp(
  EDIT_MODE_CLASSES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g',
);

// ---------------------------------------------------------------------------
// Vanilla JS for the exported static site
// ---------------------------------------------------------------------------

const MAIN_JS = `// Brad Earnhardt Portfolio — Static Site JS
(function () {
  'use strict';

  // ── Dark / Light mode toggle ──────────────────────────────────────────
  var STORAGE_KEY = 'brad-theme-mode';
  var html = document.documentElement;

  function getPreferred() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    // Fall back to initial class on <html> (set at export time)
    return html.classList.contains('dark') ? 'dark' : 'light';
  }

  function applyMode(mode) {
    html.classList.toggle('dark', mode === 'dark');
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
    // Update toggle button icon
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var sunIcon = btn.querySelector('.icon-sun');
      var moonIcon = btn.querySelector('.icon-moon');
      if (sunIcon) sunIcon.style.display = mode === 'light' ? 'block' : 'none';
      if (moonIcon) moonIcon.style.display = mode === 'dark' ? 'block' : 'none';
    }
  }

  // Apply on load
  applyMode(getPreferred());

  // Toggle button
  var toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var current = html.classList.contains('dark') ? 'dark' : 'light';
      applyMode(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Header scroll effect ──────────────────────────────────────────────
  var header = document.querySelector('header');
  if (header) {
    function onScroll() {
      if (window.scrollY > 50) {
        header.classList.remove('bg-transparent', 'py-5');
        header.classList.add('bg-bg-alt/95', 'backdrop-blur-sm', 'shadow-sm', 'py-3');
      } else {
        header.classList.remove('bg-bg-alt/95', 'backdrop-blur-sm', 'shadow-sm', 'py-3');
        header.classList.add('bg-transparent', 'py-5');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile menu toggle ────────────────────────────────────────────────
  var menuBtn = document.querySelector('button[aria-label="Toggle menu"]');
  var overlay = document.querySelector('.mobile-menu-overlay');
  var drawer  = document.querySelector('.mobile-menu-drawer');
  var closeBtn = drawer ? drawer.querySelector('button[aria-label="Close menu"]') : null;
  var hamburgerSpans = menuBtn ? menuBtn.querySelectorAll('span') : [];

  function openMenu() {
    if (overlay) overlay.classList.add('active');
    if (drawer) drawer.classList.add('active');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    if (hamburgerSpans.length === 3) {
      hamburgerSpans[0].classList.add('rotate-45', 'translate-y-2');
      hamburgerSpans[1].classList.add('opacity-0');
      hamburgerSpans[2].classList.add('-rotate-45', '-translate-y-2');
    }
  }

  function closeMenu() {
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    if (hamburgerSpans.length === 3) {
      hamburgerSpans[0].classList.remove('rotate-45', 'translate-y-2');
      hamburgerSpans[1].classList.remove('opacity-0');
      hamburgerSpans[2].classList.remove('-rotate-45', '-translate-y-2');
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // ── Smooth scroll for anchor links ────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
`;

/** Wait for a short paint cycle */
const waitForRender = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 300));
});

/** Generate a filesystem-safe filename from a URL */
function urlToFilename(url: string): string {
  try {
    const u = new URL(url);
    const base = u.pathname.replace(/^\//, '').replace(/\//g, '-') || 'image';
    const params = u.search.replace(/[?&=]/g, '-').replace(/^-+|-+$/g, '');
    const name = (base + (params ? '-' + params : '')).replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!/\.\w+$/.test(name)) return name + '.jpg';
    return name;
  } catch {
    return 'image-' + Math.random().toString(36).slice(2, 8) + '.jpg';
  }
}

/**
 * Build a <style> block that bakes custom color overrides into :root and .dark.
 * Only generates CSS for colors that were actually customized.
 */
function buildThemeStyleBlock(colors: ColorOverrides): string {
  const lightOverrides: string[] = [];
  const darkOverrides: string[] = [];

  for (const [key, value] of Object.entries(colors)) {
    if (!value) continue;
    if (key.endsWith('--dark')) {
      const baseKey = key.replace('--dark', '');
      darkOverrides.push(`  ${baseKey}: ${value};`);
    } else {
      lightOverrides.push(`  ${key}: ${value};`);
    }
  }

  let css = '';
  if (lightOverrides.length > 0) {
    css += `/* Custom color overrides (light) */\n:root {\n${lightOverrides.join('\n')}\n}\n`;
  }
  if (darkOverrides.length > 0) {
    css += `/* Custom color overrides (dark) */\n.dark {\n${darkOverrides.join('\n')}\n}\n`;
  }
  return css;
}

/** Theme toggle button markup (no HTML comments — they get stripped) */
const THEME_TOGGLE_HTML = `<button id="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark/light mode" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:50;width:40px;height:40px;border-radius:9999px;border:1px solid rgb(var(--color-border));background:rgb(var(--color-bg-alt));color:rgb(var(--color-text));display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);transition:all .2s"><svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg><svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="display:none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg></button>`;

/**
 * Capture the current page's full HTML, post-processed for static export.
 */
function capturePageHtml(
  depth: number,
  cssFilename: string,
  theme: ThemeState,
): { html: string; imageUrls: Map<string, string> } {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const prefix = depth > 0 ? '../' : '';
  const imageUrls = new Map<string, string>();

  // Set dark class based on exported theme mode
  if (theme.mode === 'dark') {
    clone.classList.add('dark');
  } else {
    clone.classList.remove('dark');
  }

  // 1. Remove editor UI elements
  clone.querySelectorAll('[data-editor-ui]').forEach((el) => el.remove());

  // 2. Remove image mode toggle
  clone.querySelectorAll('button[aria-label*="Switch to"]').forEach((el) => el.remove());

  // 3. Strip contentEditable, data-editable, edit-mode classes
  clone.querySelectorAll('[data-editable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-editable');
    if (el.className) {
      el.className = el.className.replace(EDIT_CLASS_REGEX, '').replace(/\s+/g, ' ').trim();
      if (!el.className) el.removeAttribute('class');
    }
  });

  // 4. Remove scripts except JSON-LD
  clone.querySelectorAll('script').forEach((el) => {
    if (el.getAttribute('type') === 'application/ld+json') return;
    el.remove();
  });

  // 5. Add static site JS
  const scriptTag = clone.ownerDocument.createElement('script');
  scriptTag.src = `${prefix}assets/main.js`;
  scriptTag.defer = true;
  const body = clone.querySelector('body');
  if (body) {
    body.appendChild(scriptTag);
  }

  // 6. Inject custom color overrides as <style> in <head>
  const themeCSS = buildThemeStyleBlock(theme.colors);
  if (themeCSS) {
    const head = clone.querySelector('head');
    if (head) {
      const styleEl = clone.ownerDocument.createElement('style');
      styleEl.textContent = themeCSS;
      head.appendChild(styleEl);
    }
  }

  // 7. Remove React attributes
  const root = clone.querySelector('#root');
  if (root) root.removeAttribute('data-reactroot');
  clone.querySelectorAll('[data-discover]').forEach((el) => el.removeAttribute('data-discover'));

  // 8. Handle stylesheets
  const seenStylesheetHref = new Set<string>();
  clone.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const link = el as HTMLLinkElement;
    const href = link.getAttribute('href') || '';
    if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) return;
    const newHref = `${prefix}assets/${cssFilename}`;
    if (seenStylesheetHref.has(newHref)) {
      el.remove();
    } else {
      link.setAttribute('href', newHref);
      seenStylesheetHref.add(newHref);
    }
  });

  // 9. Remove modulepreload
  clone.querySelectorAll('link[rel="modulepreload"]').forEach((el) => el.remove());

  // 10. Rewrite SPA links
  clone.querySelectorAll('a[href]').forEach((el) => {
    const a = el as HTMLAnchorElement;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    for (const rule of LINK_REWRITES) {
      if (href === rule.from) {
        a.setAttribute('href', depth > 0 ? rule.toNested : rule.toRoot);
        return;
      }
    }
  });

  // 11. Collect images and rewrite to local paths
  clone.querySelectorAll('img[src]').forEach((el) => {
    const src = el.getAttribute('src') || '';
    if (!src) return;
    let absoluteUrl: string;
    try { absoluteUrl = new URL(src, window.location.origin).href; } catch { return; }
    let localFilename: string;
    if (imageUrls.has(absoluteUrl)) {
      localFilename = imageUrls.get(absoluteUrl)!;
    } else {
      localFilename = urlToFilename(absoluteUrl);
      imageUrls.set(absoluteUrl, localFilename);
    }
    el.setAttribute('src', `${prefix}images/${localFilename}`);
  });

  // 12. Clean inline styles set by ThemeContext on <html>
  clone.removeAttribute('style');

  // Build final HTML — inject theme toggle button before </body>
  let html = `<!DOCTYPE html>\n${clone.outerHTML}`;
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace('</body>', `${THEME_TOGGLE_HTML}\n</body>`);
  return {
    html,
    imageUrls,
  };
}

/** Fetch the built CSS */
async function fetchCss(): Promise<{ content: string; filename: string } | null> {
  const link = document.querySelector('link[rel="stylesheet"][href*="assets/"]') as HTMLLinkElement | null;
  if (!link) return null;
  try {
    const resp = await fetch(link.href);
    const content = await resp.text();
    return { content, filename: 'styles.css' };
  } catch { return null; }
}

/** Download an image as bytes */
async function fetchImage(url: string): Promise<Uint8Array | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return new Uint8Array(await resp.arrayBuffer());
  } catch { return null; }
}

/**
 * Main export function.
 */
export async function exportSite(overrides: Overrides, theme: ThemeState): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('brad-portfolio-export')!;

  // CSS
  const css = await fetchCss();
  const cssFilename = css ? css.filename : 'styles.css';
  if (css) folder.folder('assets')!.file(cssFilename, css.content);

  // JS
  folder.folder('assets')!.file('main.js', MAIN_JS);

  const originalPath = window.location.pathname;
  const allImageUrls = new Map<string, string>();

  // Capture each route
  for (const route of ROUTES) {
    window.history.pushState({}, '', route.path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await waitForRender();

    const { html, imageUrls } = capturePageHtml(route.depth, cssFilename, theme);
    for (const [url, filename] of imageUrls) {
      if (!allImageUrls.has(url)) allImageUrls.set(url, filename);
    }

    if (route.file.includes('/')) {
      const parts = route.file.split('/');
      const dir = parts.slice(0, -1).join('/');
      folder.folder(dir)!.file(parts[parts.length - 1], html);
    } else {
      folder.file(route.file, html);
    }
  }

  // Navigate back
  window.history.pushState({}, '', originalPath);
  window.dispatchEvent(new PopStateEvent('popstate'));

  // Download images
  const imagesFolder = folder.folder('images')!;
  const imageEntries = Array.from(allImageUrls.entries());
  const BATCH_SIZE = 6;
  for (let i = 0; i < imageEntries.length; i += BATCH_SIZE) {
    const batch = imageEntries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ([url, filename]) => ({ filename, data: await fetchImage(url) })),
    );
    for (const { filename, data } of results) {
      if (data) imagesFolder.file(filename, data);
    }
  }

  // Edits JSON
  if (Object.keys(overrides).length > 0) {
    folder.file('edits.json', JSON.stringify(overrides, null, 2));
  }

  // Theme JSON
  if (Object.keys(theme.colors).length > 0 || theme.mode !== 'light') {
    folder.file('theme.json', JSON.stringify(theme, null, 2));
  }

  // README
  folder.file('README.txt', [
    'Brad Earnhardt — Portfolio Export',
    '='.repeat(40),
    '',
    'Static HTML + CSS + JS export of brad.fernando-vargas.com.',
    `Exported in ${theme.mode} mode.`,
    '',
    'File structure:',
    '  index.html              — Home page',
    '  work.html               — Work / case studies listing',
    '  work/*.html             — Individual case studies',
    '  process.html            — Design process',
    '  about.html              — About + resume',
    '  contact.html            — Contact info',
    '  assets/styles.css       — All styles',
    '  assets/main.js          — Dark/light toggle, header scroll, mobile menu',
    '  images/                 — All bundled images',
    '  edits.json              — Text overrides (if any)',
    '  theme.json              — Color & mode customizations (if any)',
    '',
    'The dark/light toggle button is in the bottom-right corner.',
    'Color customizations are baked into inline <style> blocks.',
    '',
    'To host: upload all files to any static web host.',
    '',
    `Exported: ${new Date().toISOString()}`,
  ].join('\n'));

  // Download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'brad-portfolio-export.zip';
  a.click();
  URL.revokeObjectURL(url);
}
