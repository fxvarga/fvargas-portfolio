import type { Skill, Tool } from './types';

export const skills: Skill[] = [
  { label: 'Figma', detail: 'wireframes, prototypes, hi-fi' },
  { label: 'Interaction design' },
  { label: 'User-centered design' },
  { label: 'Design systems' },
  { label: 'Cross-functional collaboration' },
  { label: 'Usability testing' },
];

export const tools: Tool[] = [
  { name: 'Figma', category: 'Design' },
  { name: 'Adobe Creative Cloud', category: 'Design' },
  { name: 'Adobe XD', category: 'Design' },
  { name: 'Sketch', category: 'Design' },
  { name: 'InVision', category: 'Design' },
  { name: 'React', category: 'Development' },
  { name: 'Angular', category: 'Development' },
  { name: 'HTML / CSS / SASS / SCSS', category: 'Development' },
  { name: 'JavaScript / TypeScript', category: 'Development' },
  { name: 'Git / GitHub', category: 'Development' },
  { name: 'VS Code / IntelliJ', category: 'Development' },
  { name: 'Azure DevOps / Jira', category: 'Collaboration' },
  { name: 'Microsoft Office 365', category: 'Collaboration' },
];

export const howIWork: string[] = [
  'Start with research, not assumptions',
  'Show wireframes and iterations, not just final screens',
  'Design within real technical and business constraints',
  'Collaborate daily with PMs and engineers',
  'Validate decisions with usability testing',
  'Deliver dev-ready specs, not just mockups',
];
