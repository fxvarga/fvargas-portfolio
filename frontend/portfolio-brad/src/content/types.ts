// ──────────────────────────────────────────────────
// Content types for Brad Earnhardt's portfolio
// ──────────────────────────────────────────────────

export interface SiteConfig {
  brandName: string;
  brandHighlight: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Navigation {
  links: NavLink[];
  ctaText: string;
  ctaLink: string;
}

export interface Hero {
  greeting: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  heroImage: string;
  badgeText: string;
}

export interface About {
  headline: string;
  paragraphs: string[];
  pullQuote: string;
  aboutImage: string;
  name: string;
  location: string;
  yearsExperience: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  artifacts: string[]; // image paths for example artifacts
}

export interface Skill {
  label: string;
  detail?: string;
}

export interface Tool {
  name: string;
  category: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
}

export interface ExperienceItem {
  dates: string;
  company: string;
  role: string;
  location: string;
  highlights?: string[];
}

export interface Resume {
  education: EducationItem[];
  experience: ExperienceItem[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: 'linkedin' | 'email' | 'website';
}

export interface Footer {
  tagline: string;
  ctaHeading: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  copyrightTemplate: string;
  socialLinks: SocialLink[];
}

// ──────────────────────────────────────────────────
// Case Study Types
// ──────────────────────────────────────────────────

export interface Artifact {
  image: string;
  caption: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  company: string;
  timeline: string;
  tools: string[];
  heroImage: string;
  category: string;

  problem: string;
  constraints: string[];

  research: {
    methods: string[];
    insights: string[];
  };

  process: {
    flows: Artifact[];
    wireframes: Artifact[];
    iterations: Artifact[];
  };

  design: {
    screens: Artifact[];
    systemNotes: string;
  };

  collaboration: {
    partners: string[];
    handoffNotes: string;
  };

  outcome: {
    metrics: string[];
    quote?: string;
  };
}
