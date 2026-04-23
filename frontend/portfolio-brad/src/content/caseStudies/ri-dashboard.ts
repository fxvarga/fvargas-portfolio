import type { CaseStudy } from '../types';

// TODO: BRAD CONFIRM — All copy below is placeholder based on public resume info.
// This is the "enterprise dashboard" case study to demonstrate internal-tool design.

export const riDashboard: CaseStudy = {
  slug: 'ri-analytics-dashboard',
  title: 'Rothman Index Analytics Dashboard',
  subtitle: 'Enterprise reporting tool for hospital administrators and quality teams',
  role: 'Senior UI/UX Engineer',
  company: 'PeraHealth',
  timeline: '2020 – 2023',
  tools: ['Figma', 'React', 'D3.js', 'Angular', 'Design System'],
  heroImage: '/images/case-studies/ri-dashboard/hero.png',
  category: 'Enterprise / Dashboard',

  problem:
    'Hospital administrators and quality teams needed a way to analyze patient acuity trends across units, track Rothman Index adoption metrics, and generate reports for leadership. The existing data was locked in clinical views designed for bedside nurses — not for the aggregate, trend-based analysis that administrators needed.',

  constraints: [
    'Large data volumes — some hospitals with 500+ beds generating thousands of data points daily',
    'Users range from tech-savvy data analysts to non-technical quality directors',
    'Must integrate with existing PeraHealth data infrastructure (no separate data pipeline)',
    'Reports needed for board presentations — export to PDF/CSV required',
    'HIPAA compliance for all patient-level data views',
  ],

  research: {
    methods: [
      'Interviewed 8 hospital quality directors and CMOs about reporting needs',
      'Analyzed existing ad-hoc Excel reports hospitals were building manually',
      'Card-sorting exercise to define information hierarchy',
      'Competitive analysis of healthcare analytics platforms (Tableau, Epic Reporting)',
    ],
    insights: [
      'Administrators needed unit-level and hospital-level aggregations, not individual patients',
      'Time-series trends (7-day, 30-day, 90-day) were the most requested views',
      'Existing users spent 2+ hours/week manually building Excel reports from raw exports',
      'Non-technical users needed guided report templates, not blank-canvas dashboards',
    ],
  },

  process: {
    flows: [
      { image: '/images/case-studies/ri-dashboard/flow-01.png', caption: 'User flow: select hospital → choose unit → view trends → export report' },
      { image: '/images/case-studies/ri-dashboard/flow-02.png', caption: 'Information architecture: dashboard home → drill-down → detail → export' },
    ],
    wireframes: [
      { image: '/images/case-studies/ri-dashboard/wireframe-01.png', caption: 'Wireframe: dashboard home with KPI cards and trend charts' },
      { image: '/images/case-studies/ri-dashboard/wireframe-02.png', caption: 'Wireframe: unit drill-down view with filterable data table' },
      { image: '/images/case-studies/ri-dashboard/wireframe-03.png', caption: 'Wireframe: report builder with template selection' },
    ],
    iterations: [
      { image: '/images/case-studies/ri-dashboard/iteration-01.png', caption: 'v1 had too many chart types — simplified to 3 core visualizations after testing' },
      { image: '/images/case-studies/ri-dashboard/iteration-02.png', caption: 'Filter panel moved from top bar to persistent sidebar based on user feedback' },
    ],
  },

  design: {
    screens: [
      { image: '/images/case-studies/ri-dashboard/screen-01.png', caption: 'Final: dashboard home with hospital-wide KPIs' },
      { image: '/images/case-studies/ri-dashboard/screen-02.png', caption: 'Final: unit trend analysis with time range controls' },
      { image: '/images/case-studies/ri-dashboard/screen-03.png', caption: 'Final: report export with template preview' },
    ],
    systemNotes:
      'Dashboard components built on the shared PeraHealth design system. Chart components (trend lines, bar charts, heatmaps) created as reusable Figma components with D3.js-aligned specifications.',
  },

  collaboration: {
    partners: [
      'Product Manager — feature prioritization and customer feedback triage',
      'Data engineering team — API design and query performance optimization',
      'Front-end engineers — React component architecture, D3 integration',
      'Customer success — gathering feedback from pilot hospital deployments',
    ],
    handoffNotes:
      'Delivered interactive Figma prototype for stakeholder demos, followed by component-level specs with responsive breakpoints, data state annotations (loading, empty, error), and chart interaction details.',
  },

  outcome: {
    metrics: [
      'Eliminated 2+ hours/week of manual Excel reporting for quality teams', // TODO: BRAD CONFIRM
      'Adopted by 15+ hospitals within first year of launch', // TODO: BRAD CONFIRM
      'Reduced time-to-insight for unit-level trends from days to seconds', // TODO: BRAD CONFIRM
      'Positive feedback from hospital CMOs on board-presentation export quality', // TODO: BRAD CONFIRM
    ],
    quote: 'This dashboard finally gives us the visibility we needed without having to ask IT for a custom report every time.', // TODO: BRAD CONFIRM — real quote or remove
  },
};
