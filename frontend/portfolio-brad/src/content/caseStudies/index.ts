import type { CaseStudy } from '../types';
import { rothmanMobile } from './rothman-mobile';
import { safensound } from './safensound';
import { riDashboard } from './ri-dashboard';

export const caseStudies: CaseStudy[] = [
  rothmanMobile,
  safensound,
  riDashboard,
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}

export const featuredCaseStudies = caseStudies.slice(0, 3);
