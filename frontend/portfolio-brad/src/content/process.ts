import type { ProcessStep } from './types';

export const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: 'Understand',
    description:
      'Stakeholder interviews, user research, and competitive analysis to frame the problem clearly. I dig into business goals, technical constraints, and user pain points before touching any design tool.',
    artifacts: ['/images/process/understand-artifact.png'],
  },
  {
    number: 2,
    title: 'Analyze',
    description:
      'Synthesize research into personas, journey maps, and opportunity areas. Identify patterns and prioritize problems worth solving based on user impact and business value.',
    artifacts: ['/images/process/analyze-artifact.png'],
  },
  {
    number: 3,
    title: 'Define Flows',
    description:
      'Map out task flows, information architecture, and user stories. This is where I align with PMs and engineers on scope and feasibility before visual design begins.',
    artifacts: ['/images/process/flows-artifact.png'],
  },
  {
    number: 4,
    title: 'Wireframe',
    description:
      'Low-fidelity wireframes to explore layout, hierarchy, and interaction patterns. Fast iteration, cheap to change. I share these early and often to get feedback before investing in polish.',
    artifacts: ['/images/process/wireframe-artifact.png'],
  },
  {
    number: 5,
    title: 'Prototype in Figma',
    description:
      'High-fidelity interactive prototypes in Figma, built on component libraries and design tokens. Realistic enough for usability testing, structured enough for developer handoff.',
    artifacts: ['/images/process/prototype-artifact.png'],
  },
  {
    number: 6,
    title: 'Iterate & Test',
    description:
      'Usability testing, A/B comparison, and stakeholder review cycles. I track task completion rates and user feedback to validate design decisions with evidence, not opinion.',
    artifacts: ['/images/process/iterate-artifact.png'],
  },
  {
    number: 7,
    title: 'Dev-Ready Handoff',
    description:
      'Annotated specs, design tokens, component documentation, and Figma dev mode access. I stay involved through implementation to catch gaps and answer questions in real time.',
    artifacts: ['/images/process/handoff-artifact.png'],
  },
];
