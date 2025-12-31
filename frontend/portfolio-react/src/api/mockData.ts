// Mock CMS Data - Replace with actual API calls when ready

// Import images for mock data
import heroImage from '../images/slider/fernando-portfolio-hero.png';
import aboutImage from '../images/about/fernando-portfolio-image.png';
import logoImage from '../images/logo.png';
import aiOrchestrationImg from '../images/service-single/web/ai-orchestration-minimal.png';
import finTechImg from '../images/service-single/web/fin-tech-minimal.png';
import cmsImg from '../images/service-single/web/cms-minimal.png';
import elasticSearchImg from '../images/service-single/web/elastic-search-minimal.png';

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
        description: "Built an AI-driven orchestration system that transformed natural-language process documents into executable workflows, solving the challenge of bridging human input and automated systems.",
        icon: "flaticon-vector",
        image: {
          url: aiOrchestrationImg,
          alt: "AI Workflow Orchestration",
        },
        dialogTitle: "AI Workflow",
        leadIn: "I architected an AI-powered orchestration layer using OpenAI APIs and custom integrations to transform how teams interact with structured business processes. The system ingests natural-language instructions and procedural documents, then intelligently maps them to automated workflows using prompt engineering, step extraction, and semantic routing.",
        technologies: [
          "OpenAI GPT-4 & Assistants API",
          "LangChain for orchestration",
          "Azure Functions / AWS Lambda",
          "Node.js & Python microservices",
          "Vector databases (Pinecone / Weaviate)",
        ],
        approach: [
          {
            title: "Prompt Engineering",
            content: "Designed modular prompt templates that convert user-provided documents into structured JSON workflows, enabling consistent parsing across varied input formats.",
          },
          {
            title: "Semantic Step Extraction",
            content: "Used embeddings and similarity scoring to decompose instructions into discrete, reorderable steps, reducing ambiguity and allowing dynamic reassembly.",
          },
          {
            title: "Execution Mapping",
            content: "Mapped each extracted step to backend services (APIs, database triggers, third-party integrations) using a registry-based architecture for flexibility.",
          },
          {
            title: "Feedback Loops",
            content: "Built human-in-the-loop checkpoints to verify high-stakes decisions before continuing execution, blending automation with oversight.",
          },
          {
            title: "Continuous Improvement",
            content: "Incorporated logging and analytics to capture workflow performance, allowing iterative prompt refinement and error reduction over time.",
          },
        ],
        cta: {
          title: "Have project in mind? Let's discuss",
          description: "Get in touch with us to see how we can help you with your project",
        },
      },
      {
        id: "2",
        title: "Financial Dashboard Applications",
        description: "Designed a micro-frontend dashboard platform to unify financial data across five siloed systems. Tackled the challenge of cross-system integration with shared filters, unified auth, and pluggable components.",
        icon: "flaticon-smartphone",
        image: {
          url: finTechImg,
          alt: "Financial Dashboard Applications",
        },
        dialogTitle: "Financial Dashboard Applications",
        leadIn: "I led the architecture and development of a modular financial dashboard platform designed to consolidate critical data from five previously siloed internal systems. The solution introduced a micro-frontend approach, allowing each domain team to develop and deploy independently while sharing a unified authentication layer, filtering system, and consistent UI framework.",
        technologies: [
          "React + Module Federation (Webpack 5)",
          "TypeScript",
          "Redux Toolkit for shared state",
          "OAuth 2.0 / OpenID Connect",
          "REST & GraphQL APIs",
          "D3.js / Recharts for data visualization",
          "Azure App Services for hosting",
          "CI/CD via Azure DevOps",
          "Storybook for component library",
        ],
        approach: [
          {
            title: "Micro-Frontend Architecture",
            content: "Adopted Webpack Module Federation to allow independent deployment of dashboard widgets while sharing a common shell, enabling faster release cycles per team.",
          },
          {
            title: "Unified Auth & RBAC",
            content: "Implemented a centralized identity layer with role-based access control (RBAC), so users logged in once and could access all permitted modules without reauthentication.",
          },
          {
            title: "Cross-System Filtering",
            content: "Built a shared filter context that propagated user-selected date ranges, accounts, and other parameters across all dashboard components in real-time.",
          },
          {
            title: "Performance Optimization",
            content: "Used lazy loading, memoization, and data caching strategies to maintain sub-second response times even with heavy data aggregation from multiple sources.",
          },
        ],
        cta: {
          title: "Have project in mind? Let's discuss",
          description: "Get in touch with us to see how we can help you with your project",
        },
      },
      {
        id: "3",
        title: "Content Management Systems",
        description: "Engineered a dynamic, schema-driven CMS supporting reusable templates and drag-and-drop dashboards. Solved the problem of scaling content creation for hundreds of client websites.",
        icon: "flaticon-palette",
        image: {
          url: cmsImg,
          alt: "Content Management Systems",
        },
        dialogTitle: "Content Management Systems",
        leadIn: "I designed and built a flexible, schema-driven content management system tailored for multi-tenant environments. The platform enables non-technical users to create, manage, and publish structured content using reusable templates, drag-and-drop layout tools, and real-time previews—scaling content operations across hundreds of client websites.",
        technologies: [
          "React + Next.js",
          "Node.js + Express backend",
          "MongoDB with dynamic schemas",
          "GraphQL API",
          "AWS S3 + CloudFront for asset delivery",
          "Redis caching layer",
          "Storybook for template design",
        ],
        approach: [
          {
            title: "Schema-Driven Content Modeling",
            content: "Developed a dynamic schema engine that allows admins to define custom content types (e.g., articles, events, FAQs) without code changes, using JSON Schema under the hood.",
          },
          {
            title: "Reusable Template System",
            content: "Built a library of composable templates and components, enabling consistent branding across sites while allowing per-client customization.",
          },
          {
            title: "Drag-and-Drop Editor",
            content: "Integrated a visual layout builder for content authors to construct pages without developer assistance, reducing time-to-publish and support burden.",
          },
          {
            title: "Multi-Tenancy & Permissions",
            content: "Implemented tenant isolation with role-based access control, ensuring each client's content and users remained securely partitioned.",
          },
          {
            title: "Performance at Scale",
            content: "Optimized delivery with edge caching, image CDN, and incremental static regeneration for published content, keeping page loads fast even under high traffic.",
          },
        ],
        cta: {
          title: "Have project in mind? Let's discuss",
          description: "Get in touch with us to see how we can help you with your project",
        },
      },
      {
        id: "4",
        title: "Elastic Search Platform",
        description: "Developed a fuzzy search engine using Elasticsearch and modular UI components, allowing users to find events, venues, and content across thousands of entries. Significantly improved user discovery experience.",
        icon: "flaticon-bar-chart",
        image: {
          url: elasticSearchImg,
          alt: "Elastic Search Platform",
        },
        dialogTitle: "Elastic Search Platform",
        leadIn: "I developed a high-performance search platform using Elasticsearch to power fast, typo-tolerant queries across thousands of events, venues, and content items. The solution included a modular React-based search UI and a configurable indexing pipeline, significantly improving user discovery and engagement metrics.",
        technologies: [
          "Elasticsearch 8.x",
          "Node.js ingestion service",
          "React + TypeScript frontend",
          "Debounced autocomplete & highlighting",
          "AWS OpenSearch (managed ES)",
          "Kibana for analytics",
          "Redis for caching frequent queries",
        ],
        approach: [
          {
            title: "Fuzzy & Phonetic Matching",
            content: "Configured Elasticsearch analyzers with fuzzy matching, stemming, and phonetic plugins to handle misspellings and varied user input gracefully.",
          },
          {
            title: "Faceted Filtering",
            content: "Implemented aggregation-based facets (by category, date, location) for drill-down filtering, improving discoverability and user control.",
          },
          {
            title: "Autocomplete & Suggestions",
            content: "Built a debounced autocomplete component that queries an optimized suggester index, providing instant feedback as users type.",
          },
          {
            title: "Relevance Tuning",
            content: "Iteratively tuned boost factors and scoring functions to prioritize popular or recent items, aligning search results with user expectations.",
          },
          {
            title: "Scalability & Monitoring",
            content: "Deployed on AWS OpenSearch with auto-scaling, and used Kibana dashboards to monitor query latency, error rates, and index health.",
          },
        ],
        cta: {
          title: "Have project in mind? Let's discuss",
          description: "Get in touch with us to see how we can help you with your project",
        },
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
      name: {
        label: "Name*",
        placeholder: "Your Name",
      },
      email: {
        label: "Email*",
        placeholder: "Your Email",
      },
      message: {
        label: "Message*",
        placeholder: "Message",
      },
    },
  },

  navigation: {
    logo: {
      url: logoImage,
      alt: "Logo",
    },
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
    logo: {
      url: logoImage,
      alt: "Logo",
    },
  },
};

// Mock API functions to simulate fetching from a real CMS
export const fetchCMSData = async (): Promise<CMSData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockCMSData;
};

export const fetchHeroSection = async (): Promise<HeroSection> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.hero;
};

export const fetchAboutSection = async (): Promise<AboutSection> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.about;
};

export const fetchServices = async (): Promise<ServicesSection> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.services;
};

export const fetchServiceById = async (id: string): Promise<Service | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.services.services.find((s) => s.id === id);
};

export const fetchContactSection = async (): Promise<ContactSection> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.contact;
};

export const fetchNavigation = async (): Promise<Navigation> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.navigation;
};

export const fetchSiteConfig = async (): Promise<SiteConfig> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCMSData.siteConfig;
};
