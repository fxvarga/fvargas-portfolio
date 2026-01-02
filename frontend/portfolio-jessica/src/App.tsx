import { useState, useEffect } from 'react';

// Types matching CMS data structure
interface NavLink {
  label: string;
  href: string;
}

interface Navigation {
  logoText: string;
  links: NavLink[];
}

interface Hero {
  tagline: string;
  name: string;
  subtitle: string;
}

interface About {
  title: string;
  bio: string;
}

interface PortfolioItem {
  title: string;
  category: string;
}

interface Portfolio {
  title: string;
  items: PortfolioItem[];
}

interface ServiceItem {
  title: string;
  description: string;
}

interface Services {
  title: string;
  services: ServiceItem[];
}

interface Contact {
  title: string;
  description: string;
  email: string;
}

interface Footer {
  copyright: string;
}

interface CMSContent {
  navigation: Navigation;
  hero: Hero;
  about: About;
  portfolio: Portfolio;
  services: Services;
  contact: Contact;
  footer: Footer;
}

// Default content (fallback)
const defaultContent: CMSContent = {
  navigation: {
    logoText: 'Jessica Sutherland',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' }
    ]
  },
  hero: {
    tagline: 'Photographer & Visual Artist',
    name: 'Jessica Sutherland',
    subtitle: 'Capturing moments that tell your story'
  },
  about: {
    title: 'About Me',
    bio: "I'm a professional photographer based in Austin, Texas, specializing in portrait, lifestyle, and brand photography. With over 8 years of experience, I've had the privilege of working with incredible individuals and brands to create authentic, timeless imagery that resonates."
  },
  portfolio: {
    title: 'Selected Work',
    items: [
      { title: 'Urban Portraits', category: 'Portrait' },
      { title: 'Brand Story: Bloom', category: 'Commercial' },
      { title: 'Summer Collection', category: 'Fashion' },
      { title: 'Family Sessions', category: 'Lifestyle' },
      { title: 'Editorial: Vogue', category: 'Editorial' },
      { title: 'Product Launch', category: 'Commercial' }
    ]
  },
  services: {
    title: 'Services',
    services: [
      { title: 'Portrait Sessions', description: 'Individual, couples, and family portraits that capture your unique personality and connections.' },
      { title: 'Brand Photography', description: 'Elevate your brand with cohesive visual content that tells your story and connects with your audience.' },
      { title: 'Event Coverage', description: 'From intimate gatherings to large celebrations, I document the moments that matter most.' }
    ]
  },
  contact: {
    title: "Let's Work Together",
    description: "I'd love to hear about your project and how I can help bring your vision to life.",
    email: 'hello@jessicasutherland.me'
  },
  footer: {
    copyright: 'Jessica Sutherland. All rights reserved.'
  }
};

// GraphQL query to fetch all content
const PORTFOLIO_CONTENT_QUERY = `
  query GetPortfolioContent {
    portfolioContent {
      navigation
      hero
      about
      portfolio
      services
      contact
      footer
    }
  }
`;

// Helper to parse JSON string or return object as-is
const parseJsonField = <T,>(value: T | string): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value;
};

// Fetch content from CMS
async function fetchCMSContent(): Promise<CMSContent> {
  // Determine API URL based on environment
  const apiUrl = import.meta.env.VITE_API_URL || '/graphql';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PORTFOLIO_CONTENT_QUERY,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const content = result.data?.portfolioContent;
    if (!content) {
      throw new Error('No content returned from API');
    }

    return {
      navigation: parseJsonField<Navigation>(content.navigation) || defaultContent.navigation,
      hero: parseJsonField<Hero>(content.hero) || defaultContent.hero,
      about: parseJsonField<About>(content.about) || defaultContent.about,
      portfolio: parseJsonField<Portfolio>(content.portfolio) || defaultContent.portfolio,
      services: parseJsonField<Services>(content.services) || defaultContent.services,
      contact: parseJsonField<Contact>(content.contact) || defaultContent.contact,
      footer: parseJsonField<Footer>(content.footer) || defaultContent.footer,
    };
  } catch (error) {
    console.warn('Failed to fetch CMS content, using defaults:', error);
    return defaultContent;
  }
}

function App() {
  const [content, setContent] = useState<CMSContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCMSContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #faf9f7 0%, #e8e4de 100%)'
      }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  const { navigation, hero, about, portfolio, services, contact, footer } = content;

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <a href="/" className="nav-logo">{navigation.logoText}</a>
        <ul className="nav-links">
          {navigation.links.map((link, i) => (
            <li key={i}><a href={link.href}>{link.label}</a></li>
          ))}
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <p className="tagline">{hero.tagline}</p>
        <h1>{hero.name}</h1>
        <p className="subtitle">{hero.subtitle}</p>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <h2>{about.title}</h2>
        <p>{about.bio}</p>
      </section>

      {/* Portfolio Section */}
      <section className="portfolio" id="portfolio">
        <h2>{portfolio.title}</h2>
        <div className="portfolio-grid">
          {portfolio.items.map((item, i) => (
            <div key={i} className="portfolio-item">
              <div className="portfolio-item-overlay">
                <h3 className="portfolio-item-title">{item.title}</h3>
                <span className="portfolio-item-category">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <h2>{services.title}</h2>
        <div className="services-grid">
          {services.services.map((service, i) => (
            <div key={i} className="service-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <h2>{contact.title}</h2>
        <p>{contact.description}</p>
        <a href={`mailto:${contact.email}`} className="contact-email">
          {contact.email}
        </a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} {footer.copyright}</p>
      </footer>
    </>
  );
}

export default App;
