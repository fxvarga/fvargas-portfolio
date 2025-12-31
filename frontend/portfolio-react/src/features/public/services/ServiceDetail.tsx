import React, { useState } from 'react';
import { Dialog, Grid } from '@mui/material';
import CustomDialogTitle from '../../../shared/components/CustomDialogTitle';
import SimpleReactValidator from 'simple-react-validator';
import { Service } from '../../../api/cmsApi';
import { useSiteConfig } from '../../../shared/hooks/useCMS';
import './ServiceDetail.css';

interface ServiceDetailProps {
  open: boolean;
  onClose: () => void;
  service: Service;
}

const ServiceDetailContact: React.FC<{ formEndpoint: string; submitButtonText: string }> = ({ 
  formEndpoint, 
  submitButtonText 
}) => {
  const [forms, setForms] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [validator] = useState(new SimpleReactValidator({
    className: 'errorMessage'
  }));

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForms({ ...forms, [e.target.name]: e.target.value });
    if (validator.allValid()) {
      validator.hideMessages();
    } else {
      validator.showMessages();
    }
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validator.allValid()) {
      validator.hideMessages();
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forms),
      });

      if (response.ok) {
        alert("Message sent!");
        setForms({ name: '', email: '', message: '' });
      } else {
        alert("Failed to send message. Please try again later.");
      }
    } else {
      validator.showMessages();
    }
  };

  return (
    <form onSubmit={submitHandler} className="contact-validation-active">
      <div className="row">
        <div className="col col-lg-6 col-md-6 col-12">
          <div className="form-field">
            <input
              className="form-control"
              value={forms.name}
              type="text"
              name="name"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="Your Name"
            />
          </div>
          {validator.message('name', forms.name, 'required|alpha_space')}
        </div>
        <div className="col col-lg-6 col-md-6 col-12">
          <div className="form-field">
            <input
              className="form-control"
              value={forms.email}
              type="email"
              name="email"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="Your Email"
            />
            {validator.message('email', forms.email, 'required|email')}
          </div>
        </div>
        <div className="col fullwidth col-lg-12">
          <textarea
            className="form-control"
            onBlur={changeHandler}
            onChange={changeHandler}
            value={forms.message}
            name="message"
            placeholder="Message"
          />
          {validator.message('message', forms.message, 'required')}
        </div>
      </div>
      <div className="submit-area">
        <button type="submit" className="theme-btn-s2">{submitButtonText}</button>
      </div>
    </form>
  );
};

const ServiceDetail: React.FC<ServiceDetailProps> = ({ open, onClose, service }) => {
  const { siteConfig } = useSiteConfig();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="modalWrapper quickview-dialog"
    >
      <CustomDialogTitle id="customized-dialog-title" onClose={onClose}>
        {service.dialogTitle}
      </CustomDialogTitle>
      <Grid className="modalBody modal-body">
        <div className="tp-service-single-area">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 col-12">
                <div className="tp-service-single-wrap">
                  <div className="tp-service-single-main-img mt-2">
                    <img src={service.image.url} alt={service.image.alt} />
                  </div>

                  <div className="tp-service-single-item p-3">
                    <div className="tp-service-single-title">
                      <h3>{service.title}</h3>
                    </div>
                    <p>{service.leadIn}</p>
                  </div>

                  <div className="tp-service-single-item list-widget p-3">
                    <div className="tp-service-single-title">
                      <h3>Technologies used</h3>
                    </div>
                    <ul>
                      {service.technologies.map((tech, index) => (
                        <li key={index}>{tech}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="tp-service-single-item p-3">
                    <div className="tp-service-single-title">
                      <h3>Approach</h3>
                    </div>
                    {service.approach.map((item, index) => (
                      <p key={index}>
                        <b>{item.title}</b>: {item.content}
                      </p>
                    ))}
                  </div>

                  <div className="tp-service-single-item">
                    <div className="tp-service-contact-area">
                      <div className="tp-contact-title">
                        <h2>{service.cta.title}</h2>
                        <p>{service.cta.description}</p>
                      </div>
                      <div className="tp-contact-form-area">
                        <ServiceDetailContact 
                          formEndpoint={siteConfig?.contact.formEndpoint || ''} 
                          submitButtonText="Submit Now"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Grid>
    </Dialog>
  );
};

export default ServiceDetail;
