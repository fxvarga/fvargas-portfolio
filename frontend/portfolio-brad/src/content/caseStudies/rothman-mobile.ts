import type { CaseStudy } from '../types';

// TODO: BRAD CONFIRM — All copy below is placeholder based on public resume info.
// Replace with real project details, wireframe images, and outcome metrics.

export const rothmanMobile: CaseStudy = {
  slug: 'rothman-mobile',
  title: 'Rothman Index Mobile App',
  subtitle: 'Real-time patient acuity monitoring for clinical teams on the go',
  role: 'Senior UI/UX Engineer',
  company: 'PeraHealth',
  timeline: '2019 – 2022',
  tools: ['Figma', 'React Native', 'Angular', 'WCAG 2.1'],
  heroImage: '/images/case-studies/rothman-mobile/hero.png',
  category: 'Healthcare / Mobile',

  problem:
    'Clinical staff needed real-time patient acuity data at the bedside, but the existing desktop-only Rothman Index dashboard was impractical for nurses moving between rooms. Delayed access to deterioration alerts put patient safety at risk.',

  constraints: [
    'FDA 508 clearance requirements — strict regulatory review process',
    'WCAG 2.1 AA accessibility compliance for clinical environments',
    'Must work on both iOS and Android with intermittent hospital Wi-Fi',
    'Integration with existing HL7/FHIR data pipelines',
    'Nurses have seconds, not minutes, to interpret patient status',
  ],

  research: {
    methods: [
      'Shadowed nursing staff across 3 hospital units to observe workflow',
      'Interviewed charge nurses and hospitalists on alert fatigue',
      'Analyzed usage logs from existing desktop dashboard',
      'Benchmarked competitor mobile clinical tools',
    ],
    insights: [
      'Nurses check patient status in 5-second glances between tasks',
      'Color-coded severity is the fastest signal — not numbers alone',
      'Alert fatigue from desktop system caused real alerts to be ignored',
      'Charge nurses need unit-level views; bedside nurses need patient-level',
    ],
  },

  process: {
    flows: [
      { image: '/images/case-studies/rothman-mobile/flow-01.png', caption: 'Task flow: nurse receives alert → opens app → triages patient' },
      { image: '/images/case-studies/rothman-mobile/flow-02.png', caption: 'Information architecture: unit view → patient list → patient detail' },
    ],
    wireframes: [
      { image: '/images/case-studies/rothman-mobile/wireframe-01.png', caption: 'Low-fi wireframe: patient list with color-coded acuity bands' },
      { image: '/images/case-studies/rothman-mobile/wireframe-02.png', caption: 'Low-fi wireframe: patient detail with trend graph' },
      { image: '/images/case-studies/rothman-mobile/wireframe-03.png', caption: 'Iteration: simplified header after usability feedback' },
    ],
    iterations: [
      { image: '/images/case-studies/rothman-mobile/iteration-01.png', caption: 'v1 → v2: Reduced information density based on nurse feedback' },
      { image: '/images/case-studies/rothman-mobile/iteration-02.png', caption: 'Alert badge redesign: from numeric to color+icon after testing' },
    ],
  },

  design: {
    screens: [
      { image: '/images/case-studies/rothman-mobile/screen-01.png', caption: 'Final: unit overview with real-time acuity scores' },
      { image: '/images/case-studies/rothman-mobile/screen-02.png', caption: 'Final: patient detail with 72-hour trend' },
      { image: '/images/case-studies/rothman-mobile/screen-03.png', caption: 'Final: alert notification with one-tap triage' },
    ],
    systemNotes:
      'Built on a shared design system with the desktop dashboard. Color tokens, typography scale, and component library maintained in Figma with dev-ready specs.',
  },

  collaboration: {
    partners: [
      'Product Manager — prioritization, FDA submission coordination',
      'Clinical Advisory Board — validation of alert thresholds',
      'iOS & Android engineers — feasibility reviews, handoff',
      'QA team — accessibility audit, device matrix testing',
    ],
    handoffNotes:
      'Delivered annotated Figma specs with interaction notes, component documentation, and a prototype for FDA reviewer walkthroughs.',
  },

  outcome: {
    metrics: [
      'FDA 508 clearance achieved on first submission', // TODO: BRAD CONFIRM
      'Adopted across 50+ hospital units within 6 months of launch', // TODO: BRAD CONFIRM
      'Reduced average alert response time — specific metric TBD', // TODO: BRAD CONFIRM
      'WCAG 2.1 AA compliant across all screens',
    ],
    quote: 'The mobile app gave our nurses the situational awareness they needed without adding to their cognitive burden.', // TODO: BRAD CONFIRM — real quote or remove
  },
};
