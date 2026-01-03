import React from 'react';
import { Link } from 'react-router';
import { CircularProgress } from '@mui/material';
import { useServices } from '../../../shared/hooks/useCMS';
import { generateSlug } from '../../../api/cmsApi';

interface ServiceSectionProps {
  className?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = () => {
  const { services, isLoading } = useServices();

  if (isLoading || !services) {
    return (
      <div className="tp-service-area section-padding">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <CircularProgress />
          </div>
        </div>
      </div>
    );
  }

  // Helper to get slug - use service.slug if available, otherwise generate from title
  const getSlug = (service: { slug?: string; title: string }) => 
    service.slug || generateSlug(service.title);

  return (
    <div className="tp-service-area section-padding">
      <div className="container">
        <div className="tp-section-title">
          <span>{services.label}</span>
          <h2>{services.title}</h2>
        </div>
        <div className="tp-service-wrap">
          <div className="row align-items-center">
            {services.services.map((service, index) => (
              <div className="col col-lg-3 col-md-6 col-12" key={service.id} id={`service-${index + 1}`}>
                <div className="tp-service-item">
                  <i className={`fi ${service.icon}`}></i>
                  <Link to={`/work/${getSlug(service)}`}>
                    <h2>{service.title}</h2>
                  </Link>
                  <p>{service.description}</p>
                  <Link to={`/work/${getSlug(service)}`} className="read-more">
                    <i className="fi flaticon-right-arrow"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="visible-rotate-text">
        <h1>{services.backgroundText}</h1>
      </div>
    </div>
  );
};

export default ServiceSection;
