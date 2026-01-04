import React from 'react';
import { CircularProgress } from '@mui/material';
import { WindowApp, useWindowManager } from '../context/WindowManagerContext';
import { useHero, useAbout, useServices, useContact } from '../../../../shared/hooks/useCMS';
import { fetchServiceBySlug, generateSlug } from '../../../../api/cmsApi';

interface ContentRendererProps {
  app: WindowApp;
}

// Hero content component
const HeroContent: React.FC = () => {
  const { hero, isLoading } = useHero();

  if (isLoading || !hero) {
    return <div className="os-content-loading"><CircularProgress size={24} /></div>;
  }

  return (
    <div className="os-content-hero">
      {hero.image?.url && (
        <img src={hero.image.url} alt={hero.image.alt || 'Hero'} />
      )}
      <h1>{hero.name}</h1>
      <h2>{hero.title}</h2>
      {hero.backgroundText && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          {hero.backgroundText}
        </p>
      )}
    </div>
  );
};

// About content component
const AboutContent: React.FC = () => {
  const { about, isLoading } = useAbout();

  if (isLoading || !about) {
    return <div className="os-content-loading"><CircularProgress size={24} /></div>;
  }

  return (
    <div className="os-content-about">
      <div style={{ overflow: 'hidden' }}>
        {about.image?.url && (
          <img src={about.image.url} alt={about.image.alt || 'About'} />
        )}
        <small style={{ color: '#c26a2d', display: 'block', marginBottom: '8px' }}>
          {about.greeting}
        </small>
        <h2>{about.headline}</h2>
        <h3>{about.subheadline}</h3>
        <p>{about.bio}</p>
        {about.experienceYears && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'rgba(194, 106, 45, 0.1)', 
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <strong style={{ color: '#c26a2d', fontSize: '20px' }}>{about.experienceYears}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// Services content component
const ServicesContent: React.FC = () => {
  const { services, isLoading } = useServices();
  const { openWindow } = useWindowManager();

  if (isLoading || !services) {
    return <div className="os-content-loading"><CircularProgress size={24} /></div>;
  }

  const handleServiceClick = (service: { id: string; title: string; icon?: string; slug?: string }) => {
    const serviceSlug = service.slug || generateSlug(service.title);
    openWindow({
      id: `work-${serviceSlug}`,
      title: service.title,
      sectionType: 'work',
      icon: service.icon,
      slug: serviceSlug,
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <small style={{ color: '#c26a2d' }}>{services.label}</small>
        <h2 style={{ color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>{services.title}</h2>
      </div>
      <div className="os-content-services">
        {services.services.map((service) => (
          <div 
            key={service.id} 
            className="os-service-card"
            onClick={() => handleServiceClick(service)}
          >
            {service.icon && <i className={`fi ${service.icon}`}></i>}
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Contact content component
const ContactContent: React.FC = () => {
  const { contact, isLoading } = useContact();

  if (isLoading || !contact) {
    return <div className="os-content-loading"><CircularProgress size={24} /></div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    alert('Contact form submitted! (Demo mode)');
  };

  return (
    <div className="os-content-contact">
      <h2>{contact.title}</h2>
      <p>{contact.description}</p>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <input type="text" placeholder="Subject" />
        <textarea placeholder="Your Message" required />
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
};

// Work/Service detail content component
const WorkContent: React.FC<{ slug?: string }> = ({ slug }) => {
  const [service, setService] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (slug) {
      setIsLoading(true);
      fetchServiceBySlug(slug)
        .then(setService)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [slug]);

  if (isLoading) {
    return <div className="os-content-loading"><CircularProgress size={24} /></div>;
  }

  if (!service) {
    return (
      <div className="os-content-work">
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Service not found</p>
      </div>
    );
  }

  return (
    <div className="os-content-work">
      {/* Header with icon and title */}
      <div className="os-work-header">
        {service.icon && <i className={`fi ${service.icon}`} style={{ fontSize: '32px', color: '#c26a2d', marginBottom: '12px', display: 'block' }}></i>}
        <h1>{service.dialogTitle || service.title}</h1>
        <p className="os-work-description">{service.description}</p>
      </div>

      {/* Hero image */}
      {service.image?.url && (
        <div className="os-work-image">
          <img src={service.image.url} alt={service.image.alt || service.title} />
        </div>
      )}

      {/* Lead-in / Overview */}
      {service.leadIn && (
        <div className="os-work-section">
          <h2>Overview</h2>
          <p>{service.leadIn}</p>
        </div>
      )}

      {/* Technologies */}
      {service.technologies && service.technologies.length > 0 && (
        <div className="os-work-section">
          <h2>Technologies</h2>
          <div className="os-tech-tags">
            {service.technologies.map((tech: string, i: number) => (
              <span key={i} className="os-tech-tag">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Approach */}
      {service.approach && service.approach.length > 0 && (
        <div className="os-work-section">
          <h2>Approach</h2>
          <div className="os-approach-list">
            {service.approach.map((item: { title: string; content: string }, i: number) => (
              <div key={i} className="os-approach-item">
                <h3>{item.title}</h3>
                <p>{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {service.cta && (
        <div className="os-work-cta">
          <h3>{service.cta.title}</h3>
          <p>{service.cta.description}</p>
        </div>
      )}
    </div>
  );
};

const ContentRenderer: React.FC<ContentRendererProps> = ({ app }) => {
  switch (app.sectionType) {
    case 'hero':
      return <HeroContent />;
    case 'about':
      return <AboutContent />;
    case 'services':
      return <ServicesContent />;
    case 'contact':
      return <ContactContent />;
    case 'work':
      return <WorkContent slug={app.slug} />;
    default:
      return (
        <div className="os-content-loading">
          <p>Unknown section type: {app.sectionType}</p>
        </div>
      );
  }
};

export default ContentRenderer;
