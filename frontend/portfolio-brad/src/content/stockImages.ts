/**
 * Stock image manifest — curated Unsplash images for each image slot.
 * These are used when imageMode === 'stock' and no real image exists.
 *
 * All images from Unsplash (free to use). Using ixid params for sizing.
 * When Brad provides real images, they go in /public/images/ and these
 * become the fallback.
 */

// ── Portraits ────────────────────────────────────────────
// Professional male headshot/portrait style — clean, modern
export const stockImages = {
  // Hero: professional man at desk / workspace
  heroPortrait:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1100&fit=crop&crop=faces',

  // About: professional working / thinking
  aboutPortrait:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=1000&fit=crop&crop=faces',

  // ── Case Study Heroes ──────────────────────────────────
  // Rothman Mobile: healthcare / mobile device in clinical setting
  rothmanHero:
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=675&fit=crop',

  // SafeNSound: patient monitoring / medical technology
  safensoundHero:
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&h=675&fit=crop',

  // RI Dashboard: data analytics / dashboard on screen
  riDashboardHero:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop',

  // ── Process Artifacts ──────────────────────────────────
  // 1. Understand: research / interview / discovery
  processUnderstand:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',

  // 2. Analyze: synthesis / whiteboard / sticky notes
  processAnalyze:
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=600&fit=crop',

  // 3. Define Flows: flowchart / IA / sitemap
  processFlows:
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=600&fit=crop',

  // 4. Wireframe: sketching / low-fi wireframe
  processWireframe:
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&h=600&fit=crop',

  // 5. Prototype: Figma / high-fi design on screen
  processPrototype:
    'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1200&h=600&fit=crop',

  // 6. Iterate & Test: usability testing / user session
  processIterate:
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=600&fit=crop',

  // 7. Handoff: developer collaboration / code + design
  processHandoff:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop',

  // ── Case Study Artifacts (generic UX work images) ──────

  // Flows: flowchart / user journey style
  csFlow01:
    'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800&h=500&fit=crop',
  csFlow02:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',

  // Wireframes: sketches / low-fi
  csWireframe01:
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=500&fit=crop',
  csWireframe02:
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=500&fit=crop',
  csWireframe03:
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=500&fit=crop',

  // Iterations: design comparison / before-after
  csIteration01:
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=500&fit=crop',
  csIteration02:
    'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=800&h=500&fit=crop',

  // Final screens: polished UI / dashboard / mobile app
  csScreenMobile01:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop',
  csScreenMobile02:
    'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&h=500&fit=crop',
  csScreenMobile03:
    'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&h=500&fit=crop',

  csScreenDashboard01:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
  csScreenDashboard02:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
  csScreenDashboard03:
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=500&fit=crop',

  csScreenMonitor01:
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&h=500&fit=crop',
  csScreenMonitor02:
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop',
} as const;

/**
 * Maps local image paths → stock image keys.
 * When mode === 'stock', the PlaceholderImage component
 * resolves the local path to its stock URL via this map.
 */
export const imagePathToStock: Record<string, string> = {
  // Portraits
  '/images/brad-hero.png': stockImages.heroPortrait,
  '/images/brad-about.png': stockImages.aboutPortrait,

  // Process artifacts
  '/images/process/understand-artifact.png': stockImages.processUnderstand,
  '/images/process/analyze-artifact.png': stockImages.processAnalyze,
  '/images/process/flows-artifact.png': stockImages.processFlows,
  '/images/process/wireframe-artifact.png': stockImages.processWireframe,
  '/images/process/prototype-artifact.png': stockImages.processPrototype,
  '/images/process/iterate-artifact.png': stockImages.processIterate,
  '/images/process/handoff-artifact.png': stockImages.processHandoff,

  // Rothman Mobile
  '/images/case-studies/rothman-mobile/hero.png': stockImages.rothmanHero,
  '/images/case-studies/rothman-mobile/flow-01.png': stockImages.csFlow01,
  '/images/case-studies/rothman-mobile/flow-02.png': stockImages.csFlow02,
  '/images/case-studies/rothman-mobile/wireframe-01.png': stockImages.csWireframe01,
  '/images/case-studies/rothman-mobile/wireframe-02.png': stockImages.csWireframe02,
  '/images/case-studies/rothman-mobile/wireframe-03.png': stockImages.csWireframe03,
  '/images/case-studies/rothman-mobile/iteration-01.png': stockImages.csIteration01,
  '/images/case-studies/rothman-mobile/iteration-02.png': stockImages.csIteration02,
  '/images/case-studies/rothman-mobile/screen-01.png': stockImages.csScreenMobile01,
  '/images/case-studies/rothman-mobile/screen-02.png': stockImages.csScreenMobile02,
  '/images/case-studies/rothman-mobile/screen-03.png': stockImages.csScreenMobile03,

  // SafeNSound
  '/images/case-studies/safensound/hero.png': stockImages.safensoundHero,
  '/images/case-studies/safensound/flow-01.png': stockImages.csFlow01,
  '/images/case-studies/safensound/wireframe-01.png': stockImages.csWireframe01,
  '/images/case-studies/safensound/wireframe-02.png': stockImages.csWireframe02,
  '/images/case-studies/safensound/iteration-01.png': stockImages.csIteration01,
  '/images/case-studies/safensound/screen-01.png': stockImages.csScreenMonitor01,
  '/images/case-studies/safensound/screen-02.png': stockImages.csScreenMonitor02,

  // RI Analytics Dashboard
  '/images/case-studies/ri-dashboard/hero.png': stockImages.riDashboardHero,
  '/images/case-studies/ri-dashboard/flow-01.png': stockImages.csFlow01,
  '/images/case-studies/ri-dashboard/flow-02.png': stockImages.csFlow02,
  '/images/case-studies/ri-dashboard/wireframe-01.png': stockImages.csWireframe01,
  '/images/case-studies/ri-dashboard/wireframe-02.png': stockImages.csWireframe02,
  '/images/case-studies/ri-dashboard/wireframe-03.png': stockImages.csWireframe03,
  '/images/case-studies/ri-dashboard/iteration-01.png': stockImages.csIteration01,
  '/images/case-studies/ri-dashboard/iteration-02.png': stockImages.csIteration02,
  '/images/case-studies/ri-dashboard/screen-01.png': stockImages.csScreenDashboard01,
  '/images/case-studies/ri-dashboard/screen-02.png': stockImages.csScreenDashboard02,
  '/images/case-studies/ri-dashboard/screen-03.png': stockImages.csScreenDashboard03,
};
