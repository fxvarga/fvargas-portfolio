import { useState, useEffect, useCallback, useRef } from 'react';

// Search types
interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  entityType: string;
  section?: string;
}

// Search Component
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query Search($query: String!, $limit: Int) {
              search(query: $query, limit: $limit) {
                results { id title snippet url entityType section }
              }
            }`,
            variables: { query, limit: 5 }
          })
        });
        const data = await response.json();
        setResults(data.data?.search?.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = useCallback((result: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    // Append section anchor if present and URL doesn't already have a hash
    let targetUrl = result.url;
    if (result.section && !targetUrl.includes('#')) {
      targetUrl = `${targetUrl}#${result.section}`;
    }
    window.location.href = targetUrl;
  }, []);

  return (
    <div className="search-box" ref={searchRef}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="search-input"
      />
      {isLoading && <span className="search-loading">...</span>}
      {isOpen && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((result) => (
            <div
              key={result.id}
              className="search-result"
              onClick={() => handleResultClick(result)}
            >
              <div className="search-result-title">{result.title}</div>
              <div 
                className="search-result-snippet"
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Types matching CMS data structure
interface NavLink {
  label: string;
  href: string;
}

interface Navigation {
  logoIcon: string;
  logoText: string;
  links: NavLink[];
  ctaText: string;
  ctaLink: string;
}

interface Hero {
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

interface Stat {
  value: string;
  label: string;
}

interface Stats {
  stats: Stat[];
}

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

interface Services {
  title: string;
  subtitle: string;
  services: ServiceItem[];
}

interface Feature {
  text: string;
}

interface About {
  title: string;
  description: string;
  features: Feature[];
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface Testimonials {
  title: string;
  subtitle: string;
  testimonials: Testimonial[];
}

interface Contact {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  platform: string;
  icon: string;
  href: string;
}

interface Footer {
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

interface CMSContent {
  navigation: Navigation;
  hero: Hero;
  stats: Stats;
  services: Services;
  about: About;
  testimonials: Testimonials;
  contact: Contact;
  footer: Footer;
}

// Default content (fallback)
const defaultContent: CMSContent = {
  navigation: {
    logoIcon: '🐝',
    logoText: 'The Busy Bee',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'About', href: '#about' },
      { label: 'Results', href: '#results' },
      { label: 'Testimonials', href: '#testimonials' }
    ],
    ctaText: 'Get Started',
    ctaLink: '#contact'
  },
  hero: {
    headline: 'We Make Your Brand Buzz',
    subheadline: "Award-winning digital marketing that drives real results. We're the hive mind behind some of the most successful campaigns in the industry.",
    primaryCtaText: 'Start Your Journey',
    primaryCtaLink: '#contact',
    secondaryCtaText: 'Explore Services',
    secondaryCtaLink: '#services'
  },
  stats: {
    stats: [
      { value: '250+', label: 'Happy Clients' },
      { value: '500%', label: 'Avg. ROI' },
      { value: '10M+', label: 'Leads Generated' },
      { value: '15+', label: 'Years Experience' }
    ]
  },
  services: {
    title: 'Our Hive of Services',
    subtitle: 'Everything you need to grow your digital presence, all under one roof.',
    services: [
      { icon: '🎯', title: 'Digital Strategy', description: 'Data-driven strategies that put your brand in front of the right audience at the right time.' },
      { icon: '📱', title: 'Social Media', description: 'Engaging content and community management that builds loyal followers and brand advocates.' },
      { icon: '🔍', title: 'SEO & SEM', description: 'Dominate search results and drive qualified traffic with our proven optimization techniques.' },
      { icon: '✨', title: 'Brand Identity', description: 'Memorable branding that captures your essence and resonates with your target market.' },
      { icon: '📧', title: 'Email Marketing', description: 'Personalized campaigns that nurture leads and keep your customers coming back for more.' },
      { icon: '📊', title: 'Analytics', description: 'Deep insights and reporting that turn data into actionable growth opportunities.' }
    ]
  },
  about: {
    title: 'Why Choose The Busy Bee?',
    description: "We're not just another marketing agency. We're a collective of passionate strategists, creatives, and data nerds who live and breathe digital marketing.",
    features: [
      { text: 'Results-focused approach with transparent reporting' },
      { text: 'Dedicated team assigned to your account' },
      { text: 'Cutting-edge tools and proven methodologies' },
      { text: 'Flexible packages tailored to your goals' }
    ]
  },
  testimonials: {
    title: 'What Our Clients Say',
    subtitle: "Don't just take our word for it - hear from the brands we've helped grow.",
    testimonials: [
      { quote: 'The Busy Bee transformed our online presence. Our leads increased by 300% in just 3 months!', author: 'Sarah Chen', role: 'CEO, TechStart Inc.' },
      { quote: 'Their creative approach and data-driven strategies helped us stand out in a crowded market.', author: 'Marcus Johnson', role: 'Marketing Director, GrowthCo' },
      { quote: 'Professional, responsive, and results-oriented. The best marketing decision we ever made.', author: 'Emily Rodriguez', role: 'Founder, Bloom Boutique' }
    ]
  },
  contact: {
    title: 'Ready to Make Some Buzz?',
    subtitle: "Let's discuss how we can help your brand reach new heights. Schedule a free consultation today.",
    email: 'hello@thebusybeeweb.com',
    phone: '(555) 123-4567'
  },
  footer: {
    logoIcon: '🐝',
    logoText: 'The Busy Bee',
    tagline: 'Creating buzz-worthy digital experiences since 2010.',
    serviceLinks: [
      { label: 'Digital Strategy', href: '#' },
      { label: 'Social Media', href: '#' },
      { label: 'SEO & SEM', href: '#' },
      { label: 'Brand Identity', href: '#' }
    ],
    companyLinks: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contact', href: '#' }
    ],
    email: 'hello@thebusybeeweb.com',
    phone: '(555) 123-4567',
    socialLinks: [
      { platform: 'Twitter', icon: '𝕏', href: '#' },
      { platform: 'LinkedIn', icon: 'in', href: '#' },
      { platform: 'Instagram', icon: '📷', href: '#' }
    ],
    copyright: 'The Busy Bee. All rights reserved.'
  }
};

// GraphQL query to fetch all content
const PORTFOLIO_CONTENT_QUERY = `
  query GetPortfolioContent {
    portfolioContent {
      navigation
      hero
      stats
      services
      about
      testimonials
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
      stats: parseJsonField<Stats>(content.stats) || defaultContent.stats,
      services: parseJsonField<Services>(content.services) || defaultContent.services,
      about: parseJsonField<About>(content.about) || defaultContent.about,
      testimonials: parseJsonField<Testimonials>(content.testimonials) || defaultContent.testimonials,
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
  const [menuOpen, setMenuOpen] = useState(false);

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
        background: '#FFFEF5'
      }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  const { navigation, hero, stats, services, about, testimonials, contact, footer } = content;

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">
            <span className="logo-icon">{navigation.logoIcon}</span>
            <span className="logo-text">{navigation.logoText}</span>
          </a>
          
          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="nav-right">
            <SearchBox />
            <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {navigation.links.map((link, i) => (
              <li key={i}><a href={link.href}>{link.label}</a></li>
            ))}
            <li><a href={navigation.ctaLink} className="btn btn-nav">{navigation.ctaText}</a></li>
          </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-bg">
          <div className="honeycomb"></div>
        </div>
        <div className="hero-content">
          <h1>
            {hero.headline.includes('Buzz') ? (
              <>
                {hero.headline.replace(' Buzz', '')}
                <span className="highlight"> Buzz</span>
              </>
            ) : hero.headline}
          </h1>
          <p className="hero-subtitle">{hero.subheadline}</p>
          <div className="hero-cta">
            <a href={hero.primaryCtaLink} className="btn btn-primary">{hero.primaryCtaText}</a>
            <a href={hero.secondaryCtaLink} className="btn btn-secondary">{hero.secondaryCtaText}</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hex-grid">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="hex" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <h2>{services.title}</h2>
            <p>{services.subtitle}</p>
          </div>
          <div className="services-grid">
            {services.services.map((service, index) => (
              <div key={index} className="service-card">
                <span className="service-icon">{service.icon}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2>{about.title}</h2>
              <p>{about.description}</p>
              <ul className="about-list">
                {about.features.map((feature, i) => (
                  <li key={i}>
                    <span className="check">✓</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <a href="#contact" className="btn btn-primary">Let's Talk Strategy</a>
            </div>
            <div className="about-visual">
              <div className="about-image">
                <div className="bee-pattern"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>{testimonials.title}</h2>
            <p>{testimonials.subtitle}</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>{contact.title}</h2>
            <p>{contact.subtitle}</p>
            <form className="cta-form">
              <div className="form-row">
                <input type="text" placeholder="Your Name" required />
                <input type="email" placeholder="Your Email" required />
              </div>
              <input type="text" placeholder="Company Name" />
              <textarea placeholder="Tell us about your project..." rows={4}></textarea>
              <button type="submit" className="btn btn-primary btn-large">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo">
                <span className="logo-icon">{footer.logoIcon}</span>
                <span className="logo-text">{footer.logoText}</span>
              </a>
              <p>{footer.tagline}</p>
            </div>
            <div className="footer-links">
              <h4>Services</h4>
              <ul>
                {footer.serviceLinks.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                {footer.companyLinks.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Get in Touch</h4>
              <p>{footer.email}</p>
              <p>{footer.phone}</p>
              <div className="social-links">
                {footer.socialLinks.map((link, i) => (
                  <a key={i} href={link.href} aria-label={link.platform}>{link.icon}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
