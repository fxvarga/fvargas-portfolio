import React, { useState } from 'react';
import Services from '../../api/service'
import AIAutomation from '../ServiceSingle/aiautomation';
import ApplicationModernization from '../ServiceSingle/applicationmodernization';
import ContentManagentSystem from '../ServiceSingle/contentmanagementsystem';
import ElasticSearchPlatform from '../ServiceSingle/elasticsearchplatform';
// Define interface for service items based on usage
interface ServiceItem {
  Id: string;
  sTitle: string;
  description: string;
  icon: string;
  sImgS: string;
  ssImg1: string;
  ssImg2: string;
}

// Define props interface for ServiceSection
interface ServiceSectionProps {
  className?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = (props) => {

  const [open, setOpen] = React.useState(false);

  function handleClose() {
    setOpen(false);
  }

  const [state, setState] = useState<ServiceItem>({} as ServiceItem)
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleClickOpen = (item) => {
    setOpen(true);
    setState(item);
    setSelectedService(item.Id); // Assuming each service has an id field
  }

  // Function to render the appropriate ServiceSingle component
  const renderServiceSingle = () => {
    if (!open) return null;

    // Determine which component to render based on the selected service
    switch (selectedService) {
      case "1":
        return <AIAutomation
          open={open}
          onClose={handleClose}
          title={state.sTitle}
          dImg={state.sImgS}
        />;
      case "2":
        return <ApplicationModernization
          open={open}
          onClose={handleClose}
          title={state.sTitle}
          dImg={state.sImgS}
        />;
      case "3":
        return <ContentManagentSystem
          open={open}
          onClose={handleClose}
          title={state.sTitle}
          dImg={state.sImgS}
        />;
      case "4":
        return <ElasticSearchPlatform
          open={open}
          onClose={handleClose}
          title={state.sTitle}
          dImg={state.sImgS}
        />;
      default:
        return <AIAutomation
          open={open}
          onClose={handleClose}
          title={state.sTitle}
          dImg={state.sImgS}
        />;
    }
  }

  return (
    <div className="tp-service-area section-padding">
      <div className="container">
        <div className="tp-section-title">
          <span>Enterprise Work</span>
          <h2>My featured projects</h2>
        </div>
        <div className="tp-service-wrap">
          <div className="row align-items-center">
            {Services.slice(0, 4).map((service, srv) => (
              <div className="col col-lg-3 col-md-6 col-12" key={srv}>
                <div className="tp-service-item">
                  <i className={`fi ${service.icon}`}></i>
                  <h2 onClick={() => handleClickOpen(service)}>{service.sTitle}</h2>
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
        <h1>Services</h1>
      </div>
      {renderServiceSingle()}
    </div>
  );
}

export default ServiceSection;
