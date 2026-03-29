/**
 * CMS integration layer for OpsBlueprint.
 * Fetches content from GraphQL backend with hardcoded fallback defaults.
 * Follows the same pattern as portfolio-busybee.
 */

// ──────────────────────────────────────────────────
// CMS TYPES
// ──────────────────────────────────────────────────

export interface SiteConfig {
  brandName: string;
  brandHighlight: string;
  logoSrc: string;
  logoAlt: string;
  contactEmail: string;
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

export interface HeroImage {
  src: string;
  alt: string;
}

export interface TrustIndicator {
  text: string;
}

export interface Hero {
  badgeText: string;
  headingLine1: string;
  headingHighlight: string;
  headingLine2: string;
  subheading: string;
  trustIndicators: TrustIndicator[];
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  heroImage: HeroImage;
  floatingStatValue: string;
  floatingStatDescription: string;
  floatingBadgeText: string;
}

export interface ProblemItem {
  title: string;
  description: string;
  iconId: string;
}

export interface Problem {
  heading: string;
  subheading: string;
  problems: ProblemItem[];
}

export interface SolutionStep {
  label: string;
  description: string;
  colorClass: string;
}

export interface Solution {
  heading: string;
  subheading: string;
  steps: SolutionStep[];
}

export interface ServicePackage {
  tier: string;
  name: string;
  price: string;
  description: string;
  badge: string;
  featured: boolean;
  features: string[];
}

export interface Services {
  heading: string;
  subheading: string;
  featuredBadgeText: string;
  packages: ServicePackage[];
}

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
  iconId: string;
}

export interface HowItWorks {
  heading: string;
  subheading: string;
  steps: HowItWorksStep[];
}

export interface TestimonialItem {
  name: string;
  title: string;
  metric: string;
  photo: string;
  quote: string;
}

export interface Testimonials {
  heading: string;
  subheading: string;
  testimonials: TestimonialItem[];
}

export interface Highlight {
  label: string;
  description: string;
}

export interface About {
  eyebrow: string;
  heading: string;
  bioParagraph1: string;
  bioParagraph2: string;
  linkedinUrl: string;
  linkedinLabel: string;
  portfolioUrl: string;
  portfolioLabel: string;
  avatarInitials: string;
  cardName: string;
  cardTitle: string;
  cardClosingQuote: string;
  highlights: Highlight[];
}

export interface IndustryOption {
  value: string;
  label: string;
}

export interface LeadCapture {
  heading: string;
  subheading: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  companyLabel: string;
  companyPlaceholder: string;
  industryLabel: string;
  problemLabel: string;
  problemPlaceholder: string;
  submitButtonText: string;
  submittingButtonText: string;
  privacyText: string;
  successHeading: string;
  successMessage: string;
  errorMessage: string;
  apiEndpoint: string;
  industries: IndustryOption[];
}

export interface CTA {
  heading: string;
  subheading: string;
  buttonText: string;
  buttonLink: string;
}

export interface FooterLink {
  text: string;
  href: string;
}

export interface Footer {
  tagline: string;
  servicesHeading: string;
  serviceLinks: FooterLink[];
  contactHeading: string;
  contactLinks: FooterLink[];
  copyrightTemplate: string;
}

export interface CMSContent {
  siteConfig: SiteConfig;
  navigation: Navigation;
  hero: Hero;
  problem: Problem;
  solution: Solution;
  services: Services;
  howItWorks: HowItWorks;
  testimonials: Testimonials;
  about: About;
  leadCapture: LeadCapture;
  cta: CTA;
  footer: Footer;
}

// ──────────────────────────────────────────────────
// DEFAULT CONTENT (hardcoded fallback)
// ──────────────────────────────────────────────────

export const defaultContent: CMSContent = {
  siteConfig: {
    brandName: 'Ops',
    brandHighlight: 'Blueprint',
    logoSrc: '/logo.svg',
    logoAlt: 'OpsBlueprint logo',
    contactEmail: 'fxvarga@gmail.com',
  },
  navigation: {
    links: [
      { label: 'Services', href: '#services' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'About', href: '#about' },
    ],
    ctaText: 'Get Started',
    ctaLink: '#lead-form',
  },
  hero: {
    badgeText: 'Automation for Small Businesses',
    headingLine1: 'Stop Doing',
    headingHighlight: 'Everything',
    headingLine2: 'Yourself',
    subheading:
      'You started your business to do what you love \u2014 not to spend nights on data entry, chasing emails, and building spreadsheets. We set up automations that handle the busywork, so you can get back to running your business.',
    trustIndicators: [
      { text: 'Built for small teams' },
      { text: 'Up and running in weeks' },
    ],
    primaryCtaText: 'Get a Free Consultation',
    primaryCtaLink: '#lead-form',
    secondaryCtaText: 'See How It Works',
    secondaryCtaLink: '#how-it-works',
    heroImage: {
      src: '/images/hero-workspace.jpg',
      alt: 'Team collaborating on workflow automation in a modern office',
    },
    floatingStatValue: '20+ hrs saved',
    floatingStatDescription: 'per week, per business',
    floatingBadgeText: 'AI-Powered',
  },
  problem: {
    heading: "Running a small business shouldn\u2019t mean doing everything manually",
    subheading: "If you\u2019re wearing every hat in your business, these probably hit close to home.",
    problems: [
      { title: "You\u2019re the owner AND the admin", description: "Copying data between spreadsheets, updating CRMs, chasing invoices \u2014 you didn\u2019t start a business to do data entry all day.", iconId: 'clipboard' },
      { title: 'Leads slip through the cracks', description: 'Without a dedicated sales team, inquiries pile up in your inbox. By the time you reply, the prospect has moved on.', iconId: 'funnel' },
      { title: 'Quotes and proposals eat up your evenings', description: "Building each proposal from scratch takes time you don\u2019t have. It\u2019s after-hours work that delays your pipeline.", iconId: 'clock' },
      { title: "You can\u2019t afford a full IT team", description: "Hiring developers or an operations manager isn\u2019t in the budget yet, but you\u2019ve outgrown sticky notes and spreadsheets.", iconId: 'calculator' },
    ],
  },
  solution: {
    heading: 'We connect the tools you already use \u2014 so they work for you',
    subheading: "No ripping out what works. We link your email, CRM, spreadsheets, and forms into automated pipelines that run 24/7 \u2014 even when you\u2019re off the clock.",
    steps: [
      { label: 'Intake', description: 'Leads, emails, and customer requests flow into one place automatically.', colorClass: 'bg-primary-500' },
      { label: 'Automation', description: 'Smart workflows sort, route, and act on each item \u2014 no manual steps.', colorClass: 'bg-primary-600' },
      { label: 'Tracking', description: 'You see everything that happened, in real time, from your phone or laptop.', colorClass: 'bg-primary-700' },
    ],
  },
  services: {
    heading: 'Packages That Fit a Small Business Budget',
    subheading: "Every dollar counts when you\u2019re growing. Pick the level that makes sense for where you are \u2014 each one pays for itself in time saved.",
    featuredBadgeText: 'Most Popular',
    packages: [
      {
        tier: 'Starter', name: 'Workflow Audit', price: '$500 - $1,500',
        description: 'We map how your business actually runs today, find the time-wasters, and hand you a clear plan for what to automate first.',
        badge: 'gray', featured: false,
        features: ['Process mapping & documentation', 'Bottleneck identification', 'Tool & integration assessment', 'Prioritized automation roadmap', 'ROI projections for your budget'],
      },
      {
        tier: 'Professional', name: 'Core Automation', price: '$5,000 - $15,000',
        description: 'We build the automations that give you your time back \u2014 lead follow-ups, invoicing, data syncing \u2014 so you can focus on customers.',
        badge: 'blue', featured: true,
        features: ['Everything in Workflow Audit', 'Custom n8n/Zapier workflows', 'CRM & email integration', 'Lead intake automation', 'Proposal generation pipeline', '30-day post-launch support'],
      },
      {
        tier: 'Growth', name: 'Advanced Systems', price: '$15,000 - $40,000',
        description: 'For growing businesses ready to scale operations \u2014 AI-powered triage, multi-step approvals, and dashboards that keep you in control.',
        badge: 'green', featured: false,
        features: ['Everything in Core Automation', 'AI-powered email triage', 'Multi-step approval workflows', 'Custom reporting dashboards', 'API integrations & webhooks', 'Dedicated support & training'],
      },
    ],
  },
  howItWorks: {
    heading: 'How It Works',
    subheading: 'A simple, no-nonsense process designed for busy owners \u2014 not months of meetings.',
    steps: [
      { number: '01', title: 'Analyze', description: 'We sit down with you (not a committee) and walk through how your business actually runs \u2014 finding the tasks that eat up your time and could be automated.', iconId: 'magnifier' },
      { number: '02', title: 'Design', description: "We pick the right tools for your budget (n8n, Zapier, or custom), sketch the workflows, and show you exactly what you\u2019ll save before we build anything.", iconId: 'pencil-ruler' },
      { number: '03', title: 'Implement', description: 'We build, test, and launch your automations \u2014 then walk you through everything and stick around for 30 days to make sure it all runs smoothly.', iconId: 'rocket' },
    ],
  },
  testimonials: {
    heading: 'What Our Clients Say',
    subheading: 'Real results from small business owners who stopped doing everything manually.',
    testimonials: [
      { name: 'Sarah Mitchell', title: 'Owner, Horizon Events (12 employees)', metric: '3 hrs/day saved', photo: '/images/testimonial-1.jpg', quote: 'I was spending the first three hours of every morning sorting emails and updating our booking spreadsheet. Fernando automated the whole thing in two weeks. Now leads land in our CRM, clients get an instant reply, and I actually start my day with coffee instead of data entry.' },
      { name: 'Marcus Chen', title: 'Founder, Pacific Coast Catering (8 employees)', metric: '100% ROI in 30 days', photo: '/images/testimonial-2.jpg', quote: 'We tried setting up Zapier ourselves and gave up after a weekend. Fernando came in, mapped our entire order-to-invoice flow, and by week three we had zero manual data entry between our CRM and QuickBooks. The project paid for itself in the first month.' },
      { name: 'Elena Rodriguez', title: 'Co-Owner, Clearview Property Group (5 employees)', metric: '45 min \u2192 seconds', photo: '/images/testimonial-3.jpg', quote: "As a two-person sales team, we couldn\u2019t afford to spend 45 minutes building each proposal by hand. Now our intake form triggers a branded proposal automatically \u2014 accurate, professional, and delivered in seconds. It\u2019s like having an extra employee." },
    ],
  },
  about: {
    eyebrow: 'About the Founder',
    heading: 'Built by an engineer who gets small business',
    bioParagraph1: "I\u2019m Fernando Vargas, a Senior Full-Stack Engineer with 12+ years of experience building systems across finance, healthcare, and service businesses. I\u2019ve watched small business owners spend their nights on work that a well-built automation could handle in seconds.",
    bioParagraph2: 'OpsBlueprint exists because I kept seeing the same pattern: talented owners stuck doing admin work instead of growing their business. I bring the same caliber of automation that large companies use, packaged and priced for businesses with 5 to 50 people.',
    linkedinUrl: 'https://www.linkedin.com/in/fernando-vargas-16234254/',
    linkedinLabel: 'LinkedIn',
    portfolioUrl: 'https://fernando-vargas.com',
    portfolioLabel: 'Portfolio',
    avatarInitials: 'FV',
    cardName: 'Fernando Vargas',
    cardTitle: 'Senior Full-Stack Engineer',
    cardClosingQuote: 'I built OpsBlueprint because small business owners deserve the same automation power that big companies have \u2014 without the big company price tag.',
    highlights: [
      { label: '12+ Years', description: 'Full-stack engineering experience' },
      { label: 'Small Business Focus', description: 'Built for teams of 5\u201350 people' },
      { label: 'AI + Automation', description: 'Modern tools, practical results' },
    ],
  },
  leadCapture: {
    heading: "Tell Us What\u2019s Eating Up Your Time",
    subheading: "Describe the task you wish you could stop doing. We\u2019ll respond with a free analysis and a plan to automate it \u2014 no strings attached.",
    nameLabel: 'Full Name',
    namePlaceholder: 'Jane Smith',
    emailLabel: 'Email',
    emailPlaceholder: 'jane@mybusiness.com',
    companyLabel: 'Company',
    companyPlaceholder: 'My Business LLC',
    industryLabel: 'Industry',
    problemLabel: 'What task do you wish you could stop doing?',
    problemPlaceholder: 'e.g., I spend 2 hours every morning manually entering orders from email into our spreadsheet...',
    submitButtonText: 'Get Your Free Consultation',
    submittingButtonText: 'Submitting...',
    privacyText: 'No spam. No pressure. Just a free look at how we can save you time.',
    successHeading: 'Thank you!',
    successMessage: "We\u2019ve received your request and will reach out within 24 hours to discuss how we can help your business run on autopilot.",
    errorMessage: 'Failed to submit. Please try again.',
    apiEndpoint: '/api/leads',
    industries: [
      { value: 'catering', label: 'Catering & Food Service' },
      { value: 'events', label: 'Event Planning & Management' },
      { value: 'accounting', label: 'Accounting & Finance' },
      { value: 'property', label: 'Property Management' },
      { value: 'healthcare', label: 'Healthcare Services' },
      { value: 'professional', label: 'Professional Services' },
      { value: 'retail', label: 'Retail & E-Commerce' },
      { value: 'construction', label: 'Construction & Trades' },
      { value: 'other', label: 'Other' },
    ],
  },
  cta: {
    heading: 'Ready to stop working IN your business and start working ON it?',
    subheading: 'Small business owners like you are reclaiming 20+ hours a week by letting automations handle the repetitive stuff.',
    buttonText: 'Start Your Free Consultation',
    buttonLink: '#lead-form',
  },
  footer: {
    tagline: 'Workflow automation built for small businesses. We handle the busywork so you can focus on your customers.',
    servicesHeading: 'Services',
    serviceLinks: [
      { text: 'Workflow Audit', href: '#services' },
      { text: 'Core Automation', href: '#services' },
      { text: 'Advanced Systems', href: '#services' },
    ],
    contactHeading: 'Get In Touch',
    contactLinks: [
      { text: 'Request a Consultation', href: '#lead-form' },
      { text: 'fxvarga@gmail.com', href: 'mailto:fxvarga@gmail.com' },
    ],
    copyrightTemplate: '\u00a9 {year} OpsBlueprint. All rights reserved.',
  },
};

// ──────────────────────────────────────────────────
// GRAPHQL FETCH
// ──────────────────────────────────────────────────

const PORTFOLIO_CONTENT_QUERY = `
  query GetPortfolioContent {
    portfolioContent {
      siteConfig: site_config
      navigation
      hero
      problem
      solution
      services
      howItWorks: how_it_works
      testimonials
      about
      leadCapture: lead_capture
      cta
      footer
    }
  }
`;

const parseJsonField = <T,>(value: T | string | null | undefined, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
};

export async function fetchCMSContent(): Promise<CMSContent> {
  const apiUrl = import.meta.env.VITE_API_URL || '/graphql';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: PORTFOLIO_CONTENT_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const c = result.data?.portfolioContent;
    if (!c) {
      throw new Error('No content returned from API');
    }

    return {
      siteConfig: parseJsonField<SiteConfig>(c.siteConfig, defaultContent.siteConfig),
      navigation: parseJsonField<Navigation>(c.navigation, defaultContent.navigation),
      hero: parseJsonField<Hero>(c.hero, defaultContent.hero),
      problem: parseJsonField<Problem>(c.problem, defaultContent.problem),
      solution: parseJsonField<Solution>(c.solution, defaultContent.solution),
      services: parseJsonField<Services>(c.services, defaultContent.services),
      howItWorks: parseJsonField<HowItWorks>(c.howItWorks, defaultContent.howItWorks),
      testimonials: parseJsonField<Testimonials>(c.testimonials, defaultContent.testimonials),
      about: parseJsonField<About>(c.about, defaultContent.about),
      leadCapture: parseJsonField<LeadCapture>(c.leadCapture, defaultContent.leadCapture),
      cta: parseJsonField<CTA>(c.cta, defaultContent.cta),
      footer: parseJsonField<Footer>(c.footer, defaultContent.footer),
    };
  } catch (error) {
    console.warn('Failed to fetch CMS content, using defaults:', error);
    return defaultContent;
  }
}
