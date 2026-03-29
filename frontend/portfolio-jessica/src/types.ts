// CMS types for Jessica portfolio — extracted from App.tsx for shared use

export interface SiteConfig {
  siteTitle: string;
  email: string;
  linkedIn: string;
  location: string;
  resumeUrl: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Navigation {
  logoUrl: string;
  links: NavLink[];
}

export interface AnimatedTitle {
  text: string;
}

export interface SliderImage {
  url: string;
  alt: string;
}

export interface Hero {
  animatedTitles: AnimatedTitle[];
  description: string;
  sliderImages: SliderImage[];
  resumeButtonText: string;
  contactButtonText: string;
}

export interface Skill {
  icon: string;
  title: string;
  description: string;
}

export interface About {
  preTitle: string;
  headline: string;
  bio: string;
  imageUrl: string;
  coverLetterUrl: string;
  skills: Skill[];
}

export interface CaseStudy {
  number: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
}

export interface CaseStudies {
  preTitle: string;
  title: string;
  studies: CaseStudy[];
}

export interface GalleryImage {
  url: string;
}

export interface PortfolioCategory {
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  galleryImages: GalleryImage[];
}

export interface Portfolio {
  preTitle: string;
  title: string;
  categories: PortfolioCategory[];
}

export interface Footer {
  logoUrl: string;
  thankYouMessage: string;
  linkedInUrl: string;
  copyright: string;
  email: string;
}

// Case Study Page types
export interface CaseStudyLink {
  text: string;
  url: string;
}

export interface CaseStudySection {
  heading: string;
  content: string;
  imageUrl: string;
  imagePosition: string;
  links: CaseStudyLink[];
}

export interface ValueBox {
  icon: string;
  title: string;
  description: string;
}

export interface CaseStudyPage {
  slug: string;
  title: string;
  headerTitle: string;
  headerDescription: string;
  headerBackgroundClass: string;
  sections: CaseStudySection[];
  valueBoxes: ValueBox[];
}

export interface CMSContent {
  siteConfig: SiteConfig;
  navigation: Navigation;
  hero: Hero;
  about: About;
  caseStudies: CaseStudies;
  portfolio: Portfolio;
  footer: Footer;
  caseStudyPages: CaseStudyPage[];
}
