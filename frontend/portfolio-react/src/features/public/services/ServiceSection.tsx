import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import ServiceDetail from './ServiceDetail';
import { useServices } from '../../../shared/hooks/useCMS';
import { Service } from '../../../api/cmsApi';

interface ServiceSectionProps {
  className?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = () => {
  const { services, isLoading } = useServices();
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleClose = () => {
    setOpen(false);
    setSelectedService(null);
  };

  const handleClickOpen = (service: Service) => {
    setOpen(true);
    setSelectedService(service);
  };

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

  return (
    <div className="tp-service-area section-padding">
      <div className="container">
        <div className="tp-section-title">
          <span>{services.label}</span>
          <h2>{services.title}</h2>
        </div>
        <div className="tp-service-wrap">
          <div className="row align-items-center">
            {services.services.map((service) => (
              <div className="col col-lg-3 col-md-6 col-12" key={service.id}>
                <div className="tp-service-item">
                  <i className={`fi ${service.icon}`}></i>
                  <h2 onClick={() => handleClickOpen(service)}>{service.title}</h2>
                  <p>{service.description}</p>
                  <button className="read-more" onClick={() => handleClickOpen(service)}>
                    <i className="fi flaticon-right-arrow"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="visible-rotate-text">
        <h1>{services.backgroundText}</h1>
      </div>
      {selectedService && (
        <ServiceDetail
          open={open}
          onClose={handleClose}
          service={selectedService}
        />
      )}
    </div>
  );
};

export default ServiceSection;
