import type { CaseStudy } from '../types';

// TODO: BRAD CONFIRM — All copy below is placeholder based on public resume info.

export const safensound: CaseStudy = {
  slug: 'safensound',
  title: 'SafeNSound Platform',
  subtitle: 'Redesigning a patient monitoring platform for modern clinical workflows',
  role: 'Senior UI/UX Designer',
  company: 'Spacelabs Healthcare',
  timeline: '2023 – 2024',
  tools: ['Figma', 'Design Systems', 'WCAG 2.1', 'Jira'],
  heroImage: '/images/case-studies/safensound/hero.png',
  category: 'Healthcare / Product Design',

  problem:
    'Spacelabs\' existing patient monitoring software had an outdated interface that didn\'t scale well to modern display sizes or touch workflows. Clinicians reported difficulty finding critical vitals during high-pressure scenarios, and the UI was inconsistent across product lines.',

  constraints: [
    'Must support legacy hardware (older bedside monitors with limited resolution)',
    'Regulatory requirements for medical device software (IEC 62304)',
    'Multi-product ecosystem — changes must propagate across 3+ products',
    'Clinical staff resistant to major workflow changes mid-deployment',
    'Accessibility requirements for high-contrast clinical environments',
  ],

  research: {
    methods: [
      'Heuristic evaluation of existing monitoring interface',
      'Remote interviews with 12 ICU nurses and respiratory therapists',
      'Task analysis of alarm acknowledgment workflows',
      'Audit of competitor products (Philips, GE, Mindray)',
    ],
    insights: [
      'Critical alarms buried under non-urgent notifications',
      'Waveform display consumed screen space but rarely drove clinical decisions',
      'Nurses wanted configurable layouts for different care contexts (ICU vs. step-down)',
      'Inconsistent interaction patterns across Spacelabs products created learning curve',
    ],
  },

  process: {
    flows: [
      { image: '/images/case-studies/safensound/flow-01.png', caption: 'Alarm management flow: prioritize → acknowledge → escalate' },
    ],
    wireframes: [
      { image: '/images/case-studies/safensound/wireframe-01.png', caption: 'Wireframe: configurable vital signs dashboard layout' },
      { image: '/images/case-studies/safensound/wireframe-02.png', caption: 'Wireframe: alarm notification tray with severity tiers' },
    ],
    iterations: [
      { image: '/images/case-studies/safensound/iteration-01.png', caption: 'Layout evolution: from fixed grid to clinician-configurable panels' },
    ],
  },

  design: {
    screens: [
      { image: '/images/case-studies/safensound/screen-01.png', caption: 'Final: primary monitoring view with configurable panels' },
      { image: '/images/case-studies/safensound/screen-02.png', caption: 'Final: alarm management overlay' },
    ],
    systemNotes:
      'Established a unified design system across Spacelabs product lines — shared color tokens, component library, and interaction patterns documented in Figma.',
  },

  collaboration: {
    partners: [
      'Product Management — roadmap alignment, feature prioritization',
      'Embedded software engineers — hardware constraint discussions',
      'Clinical affairs team — regulatory compliance reviews',
      'QA — accessibility audits, cross-device testing',
    ],
    handoffNotes:
      'Delivered component-level Figma specs with interaction states, responsive breakpoints, and accessibility annotations. Maintained weekly sync with dev team through implementation.',
  },

  outcome: {
    metrics: [
      'Unified design language adopted across 3 product lines', // TODO: BRAD CONFIRM
      'Reduced alarm acknowledgment time in usability testing', // TODO: BRAD CONFIRM
      'Design system reduced new-feature design time by ~40%', // TODO: BRAD CONFIRM
    ],
  },
};
