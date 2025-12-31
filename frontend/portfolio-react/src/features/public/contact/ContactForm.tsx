import React, { useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';
import { useContact } from '../../../shared/hooks/useCMS';

const ContactForm = () => {
  const { contact, contactInfo } = useContact();

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

      const response = await fetch(contactInfo?.formEndpoint || '', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forms),
      });

      if (response.ok) {
        alert(contact?.successMessage || "Message sent!");
        setForms({ name: '', email: '', message: '' });
      } else {
        alert(contact?.errorMessage || "Failed to send message. Please try again later.");
      }
    } else {
      validator.showMessages();
    }
  };

  if (!contact || !contactInfo) {
    return null;
  }

  return (
    <form method="post" className="contact-validation-active" onSubmit={submitHandler}>
      <div className="row align-items-center">
        <div className="col-md-6 col-md-6 col-12">
          <div className="form-group">
            <label>{contact.formFields.name.label}</label>
            <input
              value={forms.name}
              type="text"
              name="name"
              onBlur={changeHandler}
              onChange={changeHandler}
              className="form-control"
              placeholder={contact.formFields.name.placeholder}
            />
            {validator.message('name', forms.name, 'required|alpha_space')}
          </div>
        </div>
        <div className="col-md-6 col-md-6 col-12">
          <div className="form-group">
            <label>{contact.formFields.email.label}</label>
            <input
              value={forms.email}
              type="email"
              name="email"
              onBlur={changeHandler}
              onChange={changeHandler}
              className="form-control"
              placeholder={contact.formFields.email.placeholder}
            />
            {validator.message('email', forms.email, 'required|email')}
          </div>
        </div>
        <div className="col-md-12">
          <div className="fullwidth form-group">
            <label>{contact.formFields.message.label}</label>
            <textarea
              onBlur={changeHandler}
              onChange={changeHandler}
              value={forms.message}
              name="message"
              className="form-control"
              placeholder={contact.formFields.message.placeholder}
            />
            {validator.message('message', forms.message, 'required')}
          </div>
        </div>
        <div className="col-md-5 order-md-1 order-2 col-12">
          <div className="submit-area">
            <button type="submit" className="theme-btn">{contact.submitButtonText}</button>
            <div id="loader">
              <i className="ti-reload"></i>
            </div>
          </div>
        </div>
        <div className="col-md-7 order-md-2 order-1 col-12">
          <div className="contact-info">
            <ul>
              <li><i className="fi flaticon-phone-call"></i> {contactInfo.phone}</li>
              <li><i className="fi flaticon-mail"></i> {contactInfo.email}</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ContactForm;
