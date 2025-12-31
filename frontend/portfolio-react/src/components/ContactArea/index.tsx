import React from 'react';
import { CircularProgress } from '@mui/material';
import ContactForm from '../ContactFrom/ContactForm';
import { useContact } from '../../context/CMSContext';

const ContactArea = () => {
  const { contact, isLoading } = useContact();

  if (isLoading || !contact) {
    return (
      <section className="tp-contact-form-area section-padding">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <CircularProgress />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tp-contact-form-area section-padding">
      <div className="container">
        <div className="tp-contact-form-wrap">
          <div className="tp-section-title">
            <h2>{contact.title}</h2>
            <p>{contact.description}</p>
          </div>
          <ContactForm />
        </div>
      </div>
      <div className="visible-rotate-text">
        <h1>{contact.backgroundText}</h1>
      </div>
    </section>
  );
};

export default ContactArea;
