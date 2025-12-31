// CMS API - Fetches content from GraphQL backend with fallback to mock data
import { gql } from '@apollo/client';
import { getClient } from './apiProvider';

// Import images for fallback mock data
import heroImage from '../assets/images/slider/fernando-portfolio-hero.png';
import aboutImage from '../assets/images/about/fernando-portfolio-image.png';
import logoImage from '../assets/images/logo.png';
import aiOrchestrationImg from '../assets/images/service-single/web/ai-orchestration-minimal.png';
import finTechImg from '../assets/images/service-single/web/fin-tech-minimal.png';
import cmsImg from '../assets/images/service-single/web/cms-minimal.png';
import elasticSearchImg from '../assets/images/service-single/web/elastic-search-minimal.png';

// Types
export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  formEndpoint: string;
}

export interface SiteConfig {
  owner: {
    name: string;
    title: string;
    tagline: string;
  };
  contact: ContactInfo;
  socialLinks: SocialLink[];
  copyright: string;
}

export interface ImageData {
  url: string;
  alt: string;
}

export interface HeroSection {
  title: string;
  name: string;
  backgroundText: string;
  image: ImageData;
  ctaButton: {
    label: string;
    scrollTo: string;
  };
  insightsDialog: {
    title: string;
    description: string;
    prompt: string;
  };
}

export interface AboutSection {
  greeting: string;
  headline: string;
  subheadline: string;
  bio: string;
  experienceYears: string;
  sectionTitle: string;
  image: ImageData;
  insightsDialog: {
    title: string;
    description: string;
  };
}

export interface ApproachItem {
  title: string;
  content: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: ImageData;
  dialogTitle: string;
  leadIn: string;
  technologies: string[];
  approach: ApproachItem[];
  cta: {
    title: string;
    description: string;
  };
}

export interface ServicesSection {
  label: string;
  title: string;
  backgroundText: string;
  services: Service[];
}

export interface ContactSection {
  title: string;
  description: string;
  backgroundText: string;
  successMessage: string;
  errorMessage: string;
  submitButtonText: string;
  formFields: {
    name: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    message: { label: string; placeholder: string };
  };
}

export interface MenuItem {
  id: number;
  title: string;
  link: string;
}

export interface Navigation {
  logo: ImageData;
  menuItems: MenuItem[];
  searchPlaceholder: string;
  devModeLabel: string;
  insightsLabel: string;
}

export interface Footer {
  logo: ImageData;
}

export interface CMSData {
  siteConfig: SiteConfig;
  hero: HeroSection;
  about: AboutSection;
  services: ServicesSection;
  contact: ContactSection;
  navigation: Navigation;
  footer: Footer;
}

// GraphQL Queries
const GET_PORTFOLIO_CONTENT = gql`
  query GetPortfolioContent {
    portfolioContent {
      siteConfig
      hero
      about
      services
      contact
      navigation
      footer
    }
  }
`;

const GET_PUBLISHED_CONTENT = gql`
  query GetPublishedContent($entityType: String!) {
    publishedContentSingle(entityType: $entityType) {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

// Image mapping for local assets (when backend returns relative paths)
const imageMap: Record<string, string> = {
  '/assets/images/slider/fernando-portfolio-hero.png': heroImage,
  '/assets/images/about/fernando-portfolio-image.png': aboutImage,
  '/assets/images/logo.png': logoImage,
  '/assets/images/service-single/web/ai-orchestration-minimal.png': aiOrchestrationImg,
  '/assets/images/service-single/web/fin-tech-minimal.png': finTechImg,
  '/assets/images/service-single/web/cms-minimal.png': cmsImg,
  '/assets/images/service-single/web/elastic-search-minimal.png': elasticSearchImg,
};

// Helper to resolve image URLs
const resolveImageUrl = (url: string): string => {
  return imageMap[url] || url;
};

// Helper to parse JSON string or return object as-is
const parseJsonField = <T>(value: T | string): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value;
};

// Helper to resolve images in an object recursively
const resolveImages = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return resolveImageUrl(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveImages(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === 'url' && typeof value === 'string') {
        result[key] = resolveImageUrl(value);
      } else {
        result[key] = resolveImages(value);
      }
    }
    return result as T;
  }
  
  return obj;
};

// Configuration flag to enable/disable API
let useApi = true;

export const setUseApi = (value: boolean) => {
  useApi = value;
};

// Try to fetch from API, fallback to mock data
const fetchFromApiOrMock = async <T>(
  fetcher: () => Promise<T>,
  mockData: T
): Promise<T> => {
  if (!useApi) {
    return mockData;
  }
  
  try {
    return await fetcher();
  } catch (error) {
    console.warn('Failed to fetch from API, using mock data:', error);
    return mockData;
  }
};

// Fallback mock data
export const mockCMSData: CMSData = {
  siteConfig: {
    owner: {
      name: "Fernando Vargas",
      title: "Senior Full-Stack Engineer",
      tagline: "Full-Stack Engineer with Passion for UX",
    },
    contact: {
      phone: "(980)-219-0610",
      email: "fxvarga@gmail.com",
      formEndpoint: "https://formspree.io/f/xjkyeqzq",
    },
    socialLinks: [
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/in/fernando-vargas-16234254/",
        icon: "ti-linkedin",
      },
    ],
    copyright: "© 2025. All rights reserved by Fernando Vargas.",
  },

  hero: {
    title: "Senior Full-Stack Engineer",
    name: "Fernando Vargas",
    backgroundText: "Developer",
    image: {
      url: heroImage,
      alt: "Fernando Vargas portrait",
    },
    ctaButton: {
      label: "Contact Me",
      scrollTo: "contact",
    },
    insightsDialog: {
      title: "AI Image Remix",
      description: "Click the button below to generate a unique AI-powered variation of this hero image. Each generation creates a different artistic interpretation.",
      prompt: "Generate a creative remix of this portfolio hero image",
    },
  },

  about: {
    greeting: "Hi I'm Fernando Vargas",
    headline: "Full-Stack Engineer with Passion for UX",
    subheadline: "Over 12 years of experience developing innovative, user-focused applications across finance, healthcare, and content-driven domains.",
    bio: "From responsive front-ends and scalable cloud systems to AI-enhanced tooling, my work has spanned diverse industries with a consistent focus on practical solutions and quality user experiences. I bring an architect's perspective and a builder's mindset to every project, guiding teams and aligning technical strategy with real business goals.",
    experienceYears: "12+",
    sectionTitle: "About Me",
    image: {
      url: aboutImage,
      alt: "Fernando Vargas",
    },
    insightsDialog: {
      title: "AI Career Insights",
      description: "In twelve years of experience across various industries, I've worked on AI orchestration, financial dashboards, CMS platforms, and more. Ask me anything about my career journey!",
    },
  },

  services: {
    label: "Enterprise Work",
    title: "My featured projects",
    backgroundText: "Services",
    services: [
      {
        id: "1",
        title: "AI Workflow Orchestration",
        description: "Built an AI-driven orchestration system that transformed natural-language process documents into executable workflows.",
        icon: "flaticon-vector",
        image: { url: aiOrchestrationImg, alt: "AI Workflow Orchestration" },
        dialogTitle: "AI Workflow",
        leadIn: "I architected an AI-powered orchestration layer using OpenAI APIs and custom integrations.",
        technologies: ["OpenAI GPT-4", "LangChain", "Azure Functions", "Node.js", "Vector databases"],
        approach: [
          { title: "Prompt Engineering", content: "Designed modular prompt templates for structured JSON workflows." },
          { title: "Semantic Step Extraction", content: "Used embeddings to decompose instructions into discrete steps." },
        ],
        cta: { title: "Have project in mind?", description: "Let's discuss" },
      },
      {
        id: "2",
        title: "Financial Dashboard Applications",
        description: "Designed a micro-frontend dashboard platform to unify financial data across five siloed systems.",
        icon: "flaticon-smartphone",
        image: { url: finTechImg, alt: "Financial Dashboard" },
        dialogTitle: "Financial Dashboard",
        leadIn: "I led the architecture of a modular financial dashboard platform.",
        technologies: ["React", "TypeScript", "Redux Toolkit", "GraphQL", "D3.js"],
        approach: [
          { title: "Micro-Frontend Architecture", content: "Adopted Webpack Module Federation." },
          { title: "Unified Auth & RBAC", content: "Implemented centralized identity layer." },
        ],
        cta: { title: "Have project in mind?", description: "Let's discuss" },
      },
      {
        id: "3",
        title: "Content Management Systems",
        description: "Engineered a dynamic, schema-driven CMS supporting reusable templates.",
        icon: "flaticon-palette",
        image: { url: cmsImg, alt: "CMS" },
        dialogTitle: "CMS",
        leadIn: "I designed a flexible, schema-driven content management system.",
        technologies: ["React", "Next.js", "MongoDB", "GraphQL", "AWS S3"],
        approach: [
          { title: "Schema-Driven Content", content: "Dynamic schema engine using JSON Schema." },
          { title: "Drag-and-Drop Editor", content: "Visual layout builder for content authors." },
        ],
        cta: { title: "Have project in mind?", description: "Let's discuss" },
      },
      {
        id: "4",
        title: "Elastic Search Platform",
        description: "Developed a fuzzy search engine using Elasticsearch.",
        icon: "flaticon-bar-chart",
        image: { url: elasticSearchImg, alt: "Elastic Search" },
        dialogTitle: "Search Platform",
        leadIn: "High-performance search platform using Elasticsearch.",
        technologies: ["Elasticsearch 8.x", "Node.js", "React", "AWS OpenSearch", "Kibana"],
        approach: [
          { title: "Fuzzy Matching", content: "Configured analyzers with fuzzy matching and stemming." },
          { title: "Faceted Filtering", content: "Aggregation-based facets for drill-down filtering." },
        ],
        cta: { title: "Have project in mind?", description: "Let's discuss" },
      },
    ],
  },

  contact: {
    title: "Send me a Message",
    description: "Your email address will not be published. Required fields are marked *",
    backgroundText: "Contact Me",
    successMessage: "Message sent!",
    errorMessage: "Failed to send message. Please try again.",
    submitButtonText: "Submit now",
    formFields: {
      name: { label: "Name*", placeholder: "Your Name" },
      email: { label: "Email*", placeholder: "Your Email" },
      message: { label: "Message*", placeholder: "Message" },
    },
  },

  navigation: {
    logo: { url: logoImage, alt: "Logo" },
    menuItems: [
      { id: 1, title: "Home", link: "hero" },
      { id: 2, title: "About", link: "about" },
      { id: 3, title: "Featured Work", link: "service" },
      { id: 4, title: "Contact", link: "contact" },
    ],
    searchPlaceholder: "Search here...",
    devModeLabel: "INSIGHTS MODE ON",
    insightsLabel: "Insights",
  },

  footer: {
    logo: { url: logoImage, alt: "Logo" },
  },
};

// API functions with fallback to mock data
export const fetchCMSData = async (): Promise<CMSData> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PORTFOLIO_CONTENT,
      fetchPolicy: 'network-only',
    });
    
    const content = data.portfolioContent;
    // Parse JSON strings from GraphQL response (AnyType returns strings)
    return resolveImages({
      siteConfig: parseJsonField<SiteConfig>(content.siteConfig),
      hero: parseJsonField<HeroSection>(content.hero),
      about: parseJsonField<AboutSection>(content.about),
      services: parseJsonField<ServicesSection>(content.services),
      contact: parseJsonField<ContactSection>(content.contact),
      navigation: parseJsonField<Navigation>(content.navigation),
      footer: parseJsonField<Footer>(content.footer),
    });
  }, mockCMSData);
};

export const fetchHeroSection = async (): Promise<HeroSection> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'hero' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<HeroSection>(data.publishedContentSingle?.data));
  }, mockCMSData.hero);
};

export const fetchAboutSection = async (): Promise<AboutSection> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'about' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<AboutSection>(data.publishedContentSingle?.data));
  }, mockCMSData.about);
};

export const fetchServices = async (): Promise<ServicesSection> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'services' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<ServicesSection>(data.publishedContentSingle?.data));
  }, mockCMSData.services);
};

export const fetchServiceById = async (id: string): Promise<Service | undefined> => {
  const services = await fetchServices();
  return services.services.find((s) => s.id === id);
};

export const fetchContactSection = async (): Promise<ContactSection> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'contact' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<ContactSection>(data.publishedContentSingle?.data));
  }, mockCMSData.contact);
};

export const fetchNavigation = async (): Promise<Navigation> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'navigation' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<Navigation>(data.publishedContentSingle?.data));
  }, mockCMSData.navigation);
};

export const fetchSiteConfig = async (): Promise<SiteConfig> => {
  return fetchFromApiOrMock(async () => {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PUBLISHED_CONTENT,
      variables: { entityType: 'site-config' },
      fetchPolicy: 'network-only',
    });
    return resolveImages(parseJsonField<SiteConfig>(data.publishedContentSingle?.data));
  }, mockCMSData.siteConfig);
};
