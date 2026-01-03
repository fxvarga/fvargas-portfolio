import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();

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

  const handleResultClick = (result: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    // Append section anchor if present and URL doesn't already have a hash
    let targetUrl = result.url;
    if (result.section && !targetUrl.includes('#')) {
      targetUrl = `${targetUrl}#${result.section}`;
    }
    navigate(targetUrl);
  };

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

// Types matching CMS data structure for Jessica's portfolio
interface SiteConfig {
  siteTitle: string;
  email: string;
  linkedIn: string;
  location: string;
  resumeUrl: string;
}

interface NavLink {
  label: string;
  href: string;
}

interface Navigation {
  logoUrl: string;
  links: NavLink[];
}

interface AnimatedTitle {
  text: string;
}

interface SliderImage {
  url: string;
  alt: string;
}

interface Hero {
  animatedTitles: AnimatedTitle[];
  description: string;
  sliderImages: SliderImage[];
  resumeButtonText: string;
  contactButtonText: string;
}

interface Skill {
  icon: string;
  title: string;
  description: string;
}

interface About {
  preTitle: string;
  headline: string;
  bio: string;
  imageUrl: string;
  coverLetterUrl: string;
  skills: Skill[];
}

interface CaseStudy {
  number: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
}

interface CaseStudies {
  preTitle: string;
  title: string;
  studies: CaseStudy[];
}

interface GalleryImage {
  url: string;
}

interface PortfolioCategory {
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  galleryImages: GalleryImage[];
}

interface Portfolio {
  preTitle: string;
  title: string;
  categories: PortfolioCategory[];
}

interface Footer {
  logoUrl: string;
  thankYouMessage: string;
  linkedInUrl: string;
  copyright: string;
  email: string;
}

// Case Study Page types
interface CaseStudyLink {
  text: string;
  url: string;
}

interface CaseStudySection {
  heading: string;
  content: string;
  imageUrl: string;
  imagePosition: string;
  links: CaseStudyLink[];
}

interface ValueBox {
  icon: string;
  title: string;
  description: string;
}

interface CaseStudyPage {
  slug: string;
  title: string;
  headerTitle: string;
  headerDescription: string;
  headerBackgroundClass: string;
  sections: CaseStudySection[];
  valueBoxes: ValueBox[];
}

interface CMSContent {
  siteConfig: SiteConfig;
  navigation: Navigation;
  hero: Hero;
  about: About;
  caseStudies: CaseStudies;
  portfolio: Portfolio;
  footer: Footer;
  caseStudyPages: CaseStudyPage[];
}

// Default content (fallback)
const defaultContent: CMSContent = {
  siteConfig: {
    siteTitle: 'Jessica Sutherland Portfolio',
    email: 'jessutherland@hotmail.com',
    linkedIn: 'https://www.linkedin.com/in/jessica-m-sutherland-9891661a/',
    location: 'Charlotte, North Carolina',
    resumeUrl: '/JessicaSutherland.Resume2023.pdf'
  },
  navigation: {
    logoUrl: '/images/logo.png',
    links: [
      { label: 'About Me', href: '#about' },
      { label: 'Case Studies', href: '#case-studies' },
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Contact', href: 'mailto:jessutherland@hotmail.com?subject=Contacting from portfolio site' }
    ]
  },
  hero: {
    animatedTitles: [
      { text: 'Marketing Leader' },
      { text: 'Brand Strategist' },
      { text: 'Creative Thinker' },
      { text: 'Transformative Leader' }
    ],
    description: 'I am an innovative and action-oriented professional with 12+ years of experience in marketing and real estate living in Charlotte, North Carolina.',
    sliderImages: [
      { url: '/images/ginko.png', alt: 'Ginkgo Project' },
      { url: '/images/510.png', alt: '5/ten Project' },
      { url: '/images/indigo.png', alt: 'Indigo Project' }
    ],
    resumeButtonText: 'My Resume',
    contactButtonText: 'Contact Me'
  },
  about: {
    preTitle: 'A little about me',
    headline: "I'm a transformative leader with a creative spark.",
    bio: "I have a creative mindset, a love for storytelling, and a talent for crafting unique experiences. I'm also a champion of transformational initiatives that create value and drive profitable growth.",
    imageUrl: '/images/jessicasutherland.jpg',
    coverLetterUrl: '/images/coverletter.jpg',
    skills: [
      { icon: '/images/service0.svg', title: 'Strategist', description: 'I influence strategy, go-to-market, brand, and sales enablement to drive change and facilitate profitable growth.' },
      { icon: '/images/service1.svg', title: 'Operational Excellence', description: "Mover of ideas into action. I'm focused on the continuous implementation and improvement of standard operating procedures." },
      { icon: '/images/service3.svg', title: 'Creative Thinker', description: "Whether I'm problem-solving, telling a story, or creating an experience, I excel at producing unique solutions that deliver results." },
      { icon: '/images/service4.svg', title: 'Collaborator', description: 'Exceptional communicator, with the ability to work with the C-suite, develop and mentor individuals, and collaborate with cross-functional teams.' }
    ]
  },
  caseStudies: {
    preTitle: 'What I bring to the table',
    title: 'Case Studies',
    studies: [
      { number: '01', title: 'I develop brands that earn a competitive advantage', description: 'With the collaboration of various agencies, graphic designers, and web developers, I directed the creation of successful brands for 5/ten Management & Ginkgo Residential.', imageUrl: '/images/brandcasestudy.jpg', linkUrl: '/case-study/5ten', linkText: 'view 5/ten case study' },
      { number: '02', title: 'Create engaging experiences', description: 'Getting to know and understanding my audience allows me to draw inspiration from their daily lives to execute an engaging living experience. The Collective artist in residence program is a great example of this in action.', imageUrl: '/images/experiencecase.jpg', linkUrl: '/case-study/experience', linkText: 'view The Collective case study' },
      { number: '03', title: 'Digital marketing transformation and execution', description: 'I believe in data-driven marketing insights that innovate go-to-market campaigns to drive growth.', imageUrl: '/images/hubsmartphone.jpg', linkUrl: '/case-study/digital-marketing', linkText: 'view my digital marketing case studies' },
      { number: '04', title: 'Focused on creating value', description: 'I have a talent for managing resources, creating agile operating procedures, and developing individuals.', imageUrl: '/images/valuethumb.jpg', linkUrl: '/case-study/value', linkText: 'view how i create value' }
    ]
  },
  portfolio: {
    preTitle: 'My Work',
    title: 'Select Portfolio Projects',
    categories: [
      { title: 'Web Development', subtitle: 'corporate, multifamily, commercial', thumbnailUrl: '/images/ginko.jpg', galleryImages: [{ url: '/images/ginkgo/1 Landing.JPG' }, { url: '/images/ginkgo/2 Properties.JPG' }] },
      { title: 'Digital Media', subtitle: 'SOCIAL, EMAIL, VIDEO & PHOTOGRAPHY', thumbnailUrl: '/images/eblast.jpg', galleryImages: [{ url: '/images/digitalmedia/Collective - eblast-01.jpg' }] },
      { title: 'Marketing Campaigns', subtitle: 'connecting with the customer', thumbnailUrl: '/images/digimark.jpg', galleryImages: [{ url: '/images/marketingcampaign/ginkgogreen.JPG' }] },
      { title: 'Marketing Collateral', subtitle: 'branding', thumbnailUrl: '/images/brandguide.jpg', galleryImages: [{ url: '/images/marketingcoll/brand guide.JPG' }] },
      { title: 'Communication', subtitle: 'PUBLIC RELATIONS', thumbnailUrl: '/images/comm.jpg', galleryImages: [{ url: '/images/xcomm/corporate comm.JPG' }] },
      { title: 'Swag Shop', subtitle: 'a digital hub', thumbnailUrl: '/images/swag.jpg', galleryImages: [] }
    ]
  },
  footer: {
    logoUrl: '/images/logo.png',
    thankYouMessage: 'Thank you for looking through my portfolio',
    linkedInUrl: 'https://www.linkedin.com/in/jessica-m-sutherland-9891661a/',
    copyright: '2024 jessicasutherland.me',
    email: 'jessutherland@hotmail.com'
  },
  caseStudyPages: []
};

// GraphQL query to fetch all content
const ALL_CONTENT_QUERY = `
  query GetAllContent {
    allPublishedContent {
      entityType
      data
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
  const apiUrl = import.meta.env.VITE_API_URL || '/graphql';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: ALL_CONTENT_QUERY,
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

    const allContent = result.data?.allPublishedContent;
    if (!allContent) {
      throw new Error('No content returned from API');
    }

    // Map content by entityType
    const contentMap: Record<string, unknown> = {};
    const caseStudyPages: CaseStudyPage[] = [];
    
    for (const item of allContent) {
      const parsedData = parseJsonField(item.data);
      if (item.entityType === 'case-study-page') {
        caseStudyPages.push(parsedData as CaseStudyPage);
      } else {
        contentMap[item.entityType] = parsedData;
      }
    }

    return {
      siteConfig: (contentMap['site-config'] as SiteConfig) || defaultContent.siteConfig,
      navigation: (contentMap['navigation'] as Navigation) || defaultContent.navigation,
      hero: (contentMap['hero'] as Hero) || defaultContent.hero,
      about: (contentMap['about'] as About) || defaultContent.about,
      caseStudies: (contentMap['case-studies'] as CaseStudies) || defaultContent.caseStudies,
      portfolio: (contentMap['portfolio'] as Portfolio) || defaultContent.portfolio,
      footer: (contentMap['footer'] as Footer) || defaultContent.footer,
      caseStudyPages,
    };
  } catch (error) {
    console.warn('Failed to fetch CMS content, using defaults:', error);
    return defaultContent;
  }
}

// Animated Text Component
function AnimatedText({ titles }: { titles: AnimatedTitle[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTitle = titles[currentIndex]?.text || '';
    const typeSpeed = isDeleting ? 50 : 100;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentTitle.length) {
          setDisplayText(currentTitle.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % titles.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex, titles]);

  return (
    <span className="animated-text">
      {displayText}
      <span className="cursor">|</span>
    </span>
  );
}

// Image Slider Component
function ImageSlider({ images }: { images: SliderImage[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % images.length);

  return (
    <div className="slider">
      <button className="slider-control prev" onClick={goToPrev}>&lt;</button>
      <div className="slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {images.map((img, i) => (
          <div key={i} className="slider-slide">
            <img src={img.url} alt={img.alt} />
          </div>
        ))}
      </div>
      <button className="slider-control next" onClick={goToNext}>&gt;</button>
    </div>
  );
}

// Lightbox Component
function Lightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  images: GalleryImage[]; 
  currentIndex: number; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (images.length === 0) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>&times;</button>
        {images.length > 1 && (
          <button className="lightbox-nav prev" onClick={onPrev}>&lt;</button>
        )}
        <img src={images[currentIndex].url} alt="" className="lightbox-image" />
        {images.length > 1 && (
          <button className="lightbox-nav next" onClick={onNext}>&gt;</button>
        )}
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

// Portfolio Item Component
function PortfolioItem({ category, onOpenLightbox }: { category: PortfolioCategory; onOpenLightbox: (images: GalleryImage[]) => void }) {
  const handleClick = () => {
    if (category.galleryImages.length > 0) {
      onOpenLightbox(category.galleryImages);
    }
  };

  return (
    <div 
      className={`portfolio-item ${category.galleryImages.length > 0 ? 'has-gallery' : ''}`}
      onClick={handleClick}
    >
      <div className="portfolio-item-overlay">
        <h3 className="portfolio-item-title">{category.title}</h3>
        <p className="portfolio-item-subtitle">{category.subtitle}</p>
        {category.galleryImages.length > 0 && (
          <p className="portfolio-item-cta">click to view all</p>
        )}
      </div>
      <img src={category.thumbnailUrl} alt={category.title} className="portfolio-item-image" />
    </div>
  );
}

// Navigation Component
function NavBar({ navigation, siteConfig, isDetailPage = false }: { navigation: Navigation; siteConfig: SiteConfig; isDetailPage?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <img src={navigation.logoUrl} alt={siteConfig.siteTitle} className="nav-logo" />
        </Link>
        <button 
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="nav-right">
          <SearchBox />
          <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {isDetailPage ? (
              <li>
                <Link to="/#case-studies" onClick={() => setMobileMenuOpen(false)}>Back To Case Studies</Link>
              </li>
            ) : (
              navigation.links.map((link, i) => (
                <li key={i}>
                  <a href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Footer Component
function FooterComponent({ footer }: { footer: Footer }) {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <img src={footer.logoUrl} alt="" className="footer-logo" />
          <p className="footer-message">{footer.thankYouMessage}</p>
          <div className="footer-social">
            <a href={footer.linkedInUrl} target="_blank" rel="noopener noreferrer" className="social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {footer.copyright}</p>
          <a href={`mailto:${footer.email}?subject=Contacting from portfolio site`} className="footer-contact">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

// Case Study Detail Page Component
function CaseStudyDetailPage({ content }: { content: CMSContent }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const caseStudyPage = content.caseStudyPages.find(p => p.slug === slug);

  useEffect(() => {
    // Handle hash-based scrolling
    if (location.hash) {
      const elementId = location.hash.slice(1); // Remove the '#'
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [slug, location.hash]);

  if (!caseStudyPage) {
    return (
      <>
        <NavBar navigation={content.navigation} siteConfig={content.siteConfig} isDetailPage />
        <div className="case-study-detail">
          <div className="case-study-header">
            <div className="container">
              <h2>Case Study Not Found</h2>
              <p>The requested case study could not be found.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '2rem' }}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <FooterComponent footer={content.footer} />
      </>
    );
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <NavBar navigation={content.navigation} siteConfig={content.siteConfig} isDetailPage />
      
      {/* Header Section */}
      <div className={`case-study-header ${caseStudyPage.headerBackgroundClass}`}>
        <div className="container">
          <h2 className="ondark">{caseStudyPage.headerTitle}</h2>
          <p className="ultra-big-fat-paragraph ondark">{caseStudyPage.headerDescription}</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="case-study-detail-content">
        {caseStudyPage.sections.map((section, index) => (
          <div 
            key={index} 
            id={`section-${index}`}
            className={`content-section ${section.imagePosition === 'left' ? 'reverse' : ''}`}
          >
            <div className="section-text">
              <h2>{section.heading}</h2>
              <p>{section.content}</p>
              {section.links && section.links.length > 0 && (
                <div className="section-links">
                  {section.links.map((link, linkIndex) => (
                    <a 
                      key={linkIndex} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="button-link"
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="section-image">
              <img src={section.imageUrl} alt={section.heading} />
            </div>
          </div>
        ))}

        {/* Value Boxes (for value page) */}
        {caseStudyPage.valueBoxes && caseStudyPage.valueBoxes.length > 0 && (
          <div className="value-boxes-section">
            <div className="value-boxes-grid">
              {caseStudyPage.valueBoxes.map((box, index) => (
                <div key={index} className={`value-box ${index % 2 === 1 ? 'shift-up' : ''}`}>
                  <img src={box.icon} alt="" className="value-box-icon" />
                  <h4>{box.title}</h4>
                  <p>{box.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="scroll-to-top">
          <button onClick={scrollToTop}>Back to top</button>
        </div>
      </div>

      <FooterComponent footer={content.footer} />
    </>
  );
}

// Home Page Component
function HomePage({ content }: { content: CMSContent }) {
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const location = useLocation();

  // Handle hash-based scrolling when navigating to home with a hash
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash]);

  const openLightbox = useCallback((images: GalleryImage[]) => {
    setLightboxImages(images);
    setLightboxIndex(0);
    setShowLightbox(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setShowLightbox(false);
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  }, [lightboxImages.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  }, [lightboxImages.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { siteConfig, navigation, hero, about, caseStudies, portfolio, footer } = content;

  return (
    <>
      <NavBar navigation={navigation} siteConfig={siteConfig} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-slider">
            <ImageSlider images={hero.sliderImages} />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">
              A <AnimatedText titles={hero.animatedTitles} />
            </h1>
            <p className="hero-description">{hero.description}</p>
            <div className="hero-buttons">
              <a 
                href={siteConfig.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                {hero.resumeButtonText}
              </a>
              <a 
                href={`mailto:${siteConfig.email}?subject=Contacting from portfolio site`} 
                className="btn btn-ghost"
              >
                {hero.contactButtonText}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-container">
          <div className="about-left">
            <p className="pre-title">{about.preTitle}</p>
            <h2 className="section-heading">{about.headline}</h2>
            <p className="about-bio">{about.bio}</p>
            <a href={about.coverLetterUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
              Learn more about me
            </a>
            <img src={about.imageUrl} alt="Jessica Sutherland" className="about-portrait" />
          </div>
          <div className="about-right">
            <div className="skills-grid">
              {about.skills.map((skill, i) => (
                <div key={i} className={`skill-card ${i % 2 === 1 ? 'shift-up' : ''}`}>
                  <img src={skill.icon} alt="" className="skill-icon" />
                  <h4 className="skill-title">{skill.title}</h4>
                  <p className="skill-description">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="case-studies" id="case-studies">
        <div className="section-header">
          <p className="pre-title">{caseStudies.preTitle}</p>
          <h2 className="section-heading">{caseStudies.title}</h2>
        </div>
        <div className="case-studies-list">
          {caseStudies.studies.map((study, i) => (
            <div key={i} className={`case-study ${i % 2 === 1 ? 'reverse' : ''}`}>
              <div className="case-study-image">
                <img src={study.imageUrl} alt={study.title} />
              </div>
              <div className="case-study-content">
                <span className="case-study-number">{study.number}</span>
                <h3 className="case-study-title">{study.title}</h3>
                <p className="case-study-description">{study.description}</p>
                <Link to={study.linkUrl} className="btn-link">{study.linkText}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="portfolio-section" id="portfolio">
        <div className="section-header">
          <p className="pre-title">{portfolio.preTitle}</p>
          <h2 className="section-heading">{portfolio.title}</h2>
        </div>
        <div className="portfolio-grid">
          {portfolio.categories.map((category, i) => (
            <PortfolioItem 
              key={i} 
              category={category} 
              onOpenLightbox={openLightbox}
            />
          ))}
        </div>
        <div className="scroll-to-top">
          <button onClick={scrollToTop}>Back to top</button>
        </div>
      </section>

      <FooterComponent footer={footer} />

      {/* Lightbox */}
      {showLightbox && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
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
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage content={content} />} />
        <Route path="/case-study/:slug" element={<CaseStudyDetailPage content={content} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
