// CMS types for Busybee portfolio — extracted from App.tsx for shared use

export interface NavLink {
  label: string;
  href: string;
}

export interface Navigation {
  logoIcon: string;
  logoText: string;
  links: NavLink[];
  ctaText: string;
  ctaLink: string;
}

export interface Hero {
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Stats {
  stats: Stat[];
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface Services {
  title: string;
  subtitle: string;
  services: ServiceItem[];
}

export interface Feature {
  text: string;
}

export interface About {
  title: string;
  description: string;
  features: Feature[];
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface Testimonials {
  title: string;
  subtitle: string;
  testimonials: Testimonial[];
}

export interface Contact {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  icon: string;
  href: string;
}

export interface Footer {
  logoIcon: string;
  logoText: string;
  tagline: string;
  serviceLinks: FooterLink[];
  companyLinks: FooterLink[];
  email: string;
  phone: string;
  socialLinks: SocialLink[];
  copyright: string;
}

export interface CMSContent {
  navigation: Navigation;
  hero: Hero;
  stats: Stats;
  services: Services;
  about: About;
  testimonials: Testimonials;
  contact: Contact;
  footer: Footer;
}
