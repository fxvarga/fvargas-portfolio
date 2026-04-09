/**
 * CMS integration layer for Brad Earnhardt's portfolio.
 * Fetches content from GraphQL backend with hardcoded fallback defaults.
 * Follows the same pattern as portfolio-opsblueprint.
 */

// ──────────────────────────────────────────────────
// CMS TYPES
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
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  heroImage: string;
  badgeText: string;
}

export interface About {
  sectionLabel: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  aboutImage: string;
  name: string;
  location: string;
  yearsExperience: string;
  language: string;
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
}

export interface Resume {
  sectionLabel: string;
  heading: string;
  education: EducationItem[];
  experience: ExperienceItem[];
}

export interface ServiceItem {
  number: string;
  title: string;
  description: string;
}

export interface Services {
  sectionLabel: string;
  heading: string;
  items: ServiceItem[];
}

export interface PortfolioItem {
  title: string;
  category: string;
  image: string;
  description: string;
}

export interface Portfolio {
  sectionLabel: string;
  heading: string;
  items: PortfolioItem[];
}

export interface StatItem {
  value: string;
  suffix: string;
  label: string;
}

export interface Stats {
  items: StatItem[];
}

export interface Contact {
  sectionLabel: string;
  heading: string;
  description: string;
  email: string;
  phone: string;
  location: string;
  submitButtonText: string;
  successMessage: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  date: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface Footer {
  tagline: string;
  ctaHeading: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  copyrightTemplate: string;
  socialLinks: SocialLink[];
}

export interface CMSContent {
  siteConfig: SiteConfig;
  navigation: Navigation;
  hero: Hero;
  about: About;
  resume: Resume;
  services: Services;
  portfolio: Portfolio;
  stats: Stats;
  contact: Contact;
  blogPosts: BlogPost[];
  footer: Footer;
}

// ──────────────────────────────────────────────────
// DEFAULT CONTENT (hardcoded fallback from Brad's resume)
// ──────────────────────────────────────────────────

export const defaultContent: CMSContent = {
  siteConfig: {
    brandName: 'Brad',
    brandHighlight: 'Earnhardt',
    contactEmail: 'uxbrad@bdesigns.net',
    contactPhone: '704-323-6921',
    location: 'Charlotte, NC',
  },
  navigation: {
    links: [
      { label: 'Home', href: '#home' },
      { label: 'About', href: '#about' },
      { label: 'Services', href: '#services' },
      { label: 'Resume', href: '#resume' },
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Blog', href: '#blog' },
    ],
    ctaText: 'Contact Me',
    ctaLink: '#contact',
  },
  hero: {
    greeting: "I'm glad you're here.",
    heading: "Hi I'm Brad Earnhardt — Crafting intuitive digital experiences that put users first",
    description:
      'Illustrator turned UX specialist with 20+ years of experience delivering intuitive, accessible software and web applications. Focused on enhancing user experience through detail-oriented, user-centered design and development.',
    ctaText: "Let's Chat",
    ctaLink: '#contact',
    heroImage: '/images/brad-hero.png',
    badgeText: 'Senior UI/UX Designer',
  },
  about: {
    sectionLabel: 'About Me',
    heading: "I'm creating user-centered design & digital experiences.",
    description:
      'Illustrator/Designer now specializing in user-centered design and development. Focused on delivering intuitive and accessible software and web applications, with a strong emphasis on enhancing user experience. A detail-oriented professional, committed to continuous learning and team collaboration, to craft visually appealing and user-centric digital solutions.',
    ctaText: 'Contact Me',
    ctaLink: '#contact',
    aboutImage: '/images/brad-about.png',
    name: 'Brad Earnhardt',
    location: 'Charlotte, NC',
    yearsExperience: '20+',
    language: 'English',
  },
  resume: {
    sectionLabel: 'Resume',
    heading: 'Education & Experience',
    education: [
      {
        institution: 'University of North Carolina at Charlotte',
        degree: 'Bachelor of Fine Arts',
        field: 'Illustration, Graphic Design',
      },
    ],
    experience: [
      {
        dates: '2023 - 2024',
        company: 'Spacelabs Healthcare',
        role: 'Senior UI/UX Designer',
        location: 'Charlotte, NC (Remote)',
      },
      {
        dates: '2018 - 2023',
        company: 'PeraHealth: The Rothman Index',
        role: 'Senior UI/UX Engineer',
        location: 'Charlotte, NC (Remote)',
      },
      {
        dates: '2012 - 2018',
        company: 'AXS Group LLC (Carbonhouse)',
        role: 'Front-End Web Developer',
        location: 'Charlotte, NC',
      },
      {
        dates: '2006 - 2012',
        company: 'American City Business Journals',
        role: 'UI Designer / Front-End Developer',
        location: 'Charlotte, NC',
      },
      {
        dates: '2006',
        company: 'Apex Systems',
        role: 'Web Designer / HTML & CSS Developer',
        location: 'Charlotte, NC',
      },
      {
        dates: '2000 - Present',
        company: 'Freelance Web Guy',
        role: 'Designer / Developer / Consultant',
        location: 'Charlotte, NC',
      },
    ],
  },
  services: {
    sectionLabel: 'Services',
    heading: 'My Services',
    items: [
      {
        number: '1',
        title: 'UI/UX Design',
        description:
          'Comprehensive user interface and experience design for web and mobile applications. From wireframes to high-fidelity prototypes, creating intuitive interfaces that delight users and meet business objectives.',
      },
      {
        number: '2',
        title: 'Front-End Development',
        description:
          'Clean, responsive, and accessible front-end development using modern frameworks like React and Angular. Building pixel-perfect implementations with HTML, CSS/SASS, and JavaScript.',
      },
      {
        number: '3',
        title: 'Design Systems',
        description:
          'Creating and maintaining cohesive visual libraries and design systems that serve as the single source of truth for design standards across all products and platforms.',
      },
      {
        number: '4',
        title: 'Prototyping & User Testing',
        description:
          'Interactive prototyping in Figma and Adobe XD for user testing. Gathering feedback to refine design solutions, ensuring WCAG compliance and optimal accessibility for all users.',
      },
    ],
  },
  portfolio: {
    sectionLabel: 'Portfolio',
    heading: 'Recent Design Work',
    items: [
      {
        title: 'Rothman Index Mobile App',
        category: 'UI/UX Design',
        image: '/images/portfolio-1.jpg',
        description: 'FDA 508 cleared mobile application for real-time patient acuity monitoring.',
      },
      {
        title: 'SafeNSound Platform',
        category: 'Product Design',
        image: '/images/portfolio-2.jpg',
        description: 'Healthcare monitoring platform design for Spacelabs Healthcare.',
      },
      {
        title: 'Rainer Monitor Software',
        category: 'UI/UX Design',
        image: '/images/portfolio-3.jpg',
        description: 'Medical device monitoring software interface design.',
      },
      {
        title: 'Venue Websites Collection',
        category: 'Web Development',
        image: '/images/portfolio-4.jpg',
        description: 'Over 70 world-class venue websites built at Carbonhouse.',
      },
      {
        title: 'Business Journals Redesign',
        category: 'Web Design',
        image: '/images/portfolio-5.jpg',
        description: 'Full site redesign of The Business Journals across 45 markets.',
      },
      {
        title: 'RI Analytics Dashboard',
        category: 'Dashboard Design',
        image: '/images/portfolio-6.jpg',
        description: 'Analytics and reporting dashboard for the Rothman Index suite.',
      },
    ],
  },
  stats: {
    items: [
      { value: '20', suffix: '+', label: 'Years Experience' },
      { value: '70', suffix: '+', label: 'Websites Built' },
      { value: '6', suffix: '+', label: 'Companies Served' },
      { value: '3', suffix: '', label: 'Major Products' },
    ],
  },
  contact: {
    sectionLabel: 'Contact',
    heading: 'Need help? Get in touch now!',
    description:
      "I'm always interested in hearing about new projects and opportunities. Whether you need a complete UI/UX overhaul or help with front-end development, let's talk.",
    email: 'uxbrad@bdesigns.net',
    phone: '704-323-6921',
    location: 'Charlotte, NC',
    submitButtonText: 'Send Message',
    successMessage: "Thank you! Your message has been sent. I'll get back to you soon.",
  },
  blogPosts: [],
  footer: {
    tagline:
      'Senior UI/UX Designer crafting intuitive digital experiences. Focused on delivering accessible, user-centered design solutions.',
    ctaHeading: "Let's Make a Consultation With Me",
    ctaButtonText: 'Contact Me',
    ctaButtonLink: '#contact',
    copyrightTemplate: '© {year} Brad Earnhardt. All rights reserved.',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/bradearnhardt/', icon: 'linkedin' },
      { platform: 'Email', url: 'mailto:uxbrad@bdesigns.net', icon: 'email' },
    ],
  },
};

// ──────────────────────────────────────────────────
// GRAPHQL FETCH
// ──────────────────────────────────────────────────

const ALL_CONTENT_QUERY = `
  query GetAllContent {
    allPublishedContent {
      entityType
      data
    }
  }
`;

const parseJsonField = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

export async function fetchCMSContent(): Promise<CMSContent> {
  const apiUrl = import.meta.env.VITE_API_URL || '/graphql';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ALL_CONTENT_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const records = result.data?.allPublishedContent;
    if (!records || !Array.isArray(records)) {
      throw new Error('No content returned from API');
    }

    // Map entity types to content, collecting blog posts as an array
    const content: CMSContent = { ...defaultContent, blogPosts: [] };
    const blogPosts: BlogPost[] = [];

    for (const record of records) {
      const data = parseJsonField<Record<string, unknown>>(record.data, {});

      switch (record.entityType) {
        case 'site-config':
          content.siteConfig = parseJsonField<SiteConfig>(data, defaultContent.siteConfig);
          break;
        case 'navigation':
          content.navigation = parseJsonField<Navigation>(data, defaultContent.navigation);
          break;
        case 'hero':
          content.hero = parseJsonField<Hero>(data, defaultContent.hero);
          break;
        case 'about':
          content.about = parseJsonField<About>(data, defaultContent.about);
          break;
        case 'resume':
          content.resume = parseJsonField<Resume>(data, defaultContent.resume);
          break;
        case 'services':
          content.services = parseJsonField<Services>(data, defaultContent.services);
          break;
        case 'portfolio':
          content.portfolio = parseJsonField<Portfolio>(data, defaultContent.portfolio);
          break;
        case 'stats':
          content.stats = parseJsonField<Stats>(data, defaultContent.stats);
          break;
        case 'contact':
          content.contact = parseJsonField<Contact>(data, defaultContent.contact);
          break;
        case 'blog-post':
          blogPosts.push(parseJsonField<BlogPost>(data, {} as BlogPost));
          break;
        case 'footer':
          content.footer = parseJsonField<Footer>(data, defaultContent.footer);
          break;
      }
    }

    content.blogPosts = blogPosts;
    return content;
  } catch (error) {
    console.warn('Failed to fetch CMS content, using defaults:', error);
    return defaultContent;
  }
}
