import type { SiteConfig, Navigation, Footer, SocialLink } from './types';

export const siteConfig: SiteConfig = {
  brandName: 'Brad',
  brandHighlight: 'Earnhardt',
  contactEmail: 'uxbrad@bdesigns.net',
  contactPhone: '704-323-6921',
  location: 'Charlotte, NC',
};

export const navigation: Navigation = {
  links: [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'Process', href: '/process' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  ctaText: 'Get In Touch',
  ctaLink: '/contact',
};

export const socialLinks: SocialLink[] = [
  { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/bradearnhardt/', icon: 'linkedin' },
  { platform: 'Email', url: 'mailto:uxbrad@bdesigns.net', icon: 'email' },
];

export const footer: Footer = {
  tagline:
    'UX Designer focused on building intuitive, scalable enterprise and product experiences.',
  ctaHeading: "Have a project in mind? Let's talk.",
  ctaButtonText: 'Get In Touch',
  ctaButtonLink: '/contact',
  copyrightTemplate: '© {year} Brad Earnhardt. All rights reserved.',
  socialLinks,
};
