import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router';
import { CircularProgress } from '@mui/material';
import { Service, fetchServiceBySlug } from '../../../api/cmsApi';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import './WorkDetailPage.css';

const WorkDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await fetchServiceBySlug(slug);
        setService(data || null);
      } catch (error) {
        console.error('Failed to load service:', error);
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadService();
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="work-detail-loading">
        <CircularProgress />
      </div>
    );
  }

  if (!service) {
    return (
      <>
        <Navbar />
        <div className="work-detail-not-found">
          <div className="container">
            <h2>Project Not Found</h2>
            <p>The requested project could not be found.</p>
            <button onClick={() => navigate('/')} className="theme-btn">
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Header */}
      <section className="work-detail-hero">
        <div className="container">
          <div className="work-detail-hero-content">
            <RouterLink to="/#services" className="back-link">
              <i className="ti-arrow-left"></i> Back to Featured Work
            </RouterLink>
            <h1>{service.title}</h1>
            <p className="work-detail-lead">{service.leadIn}</p>
          </div>
        </div>
        <div className="work-detail-hero-overlay"></div>
      </section>

      {/* Main Image */}
      <section className="work-detail-image-section">
        <div className="container">
          <div className="work-detail-main-image">
            <img src={service.image.url} alt={service.image.alt} />
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="work-detail-section">
        <div className="container">
          <div className="work-detail-grid">
            <div className="work-detail-sidebar">
              {service.technologies && service.technologies.length > 0 && (
                <div className="work-detail-info-card">
                  <h4>Technologies</h4>
                  <ul className="tech-list">
                    {service.technologies.map((tech, index) => (
                      <li key={index}>
                        <span className="tech-badge">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="work-detail-content">
              <h2>Project Overview</h2>
              <p className="overview-text">{service.description}</p>
              
              {service.approach && service.approach.length > 0 && (
                <>
                  <h3>My Approach</h3>
                  <div className="approach-list">
                    {service.approach.map((item, index) => (
                      <div key={index} className="approach-item">
                        <div className="approach-number">{String(index + 1).padStart(2, '0')}</div>
                        <div className="approach-content">
                          <h4>{item.title}</h4>
                          <p>{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {service.cta && (
        <section className="work-detail-cta">
          <div className="container">
            <div className="cta-content">
              <h2>{service.cta.title}</h2>
              <p>{service.cta.description}</p>
              <RouterLink to="/#contact" className="theme-btn">
                Get in Touch
              </RouterLink>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
};

export default WorkDetailPage;
