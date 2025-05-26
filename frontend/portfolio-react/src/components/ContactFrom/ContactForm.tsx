import React, { useState } from 'react'
import SimpleReactValidator from 'simple-react-validator';


const ContactForm = () => {

  const [forms, setForms] = useState({
    name: '',
    email: '',
    subject: '',
    phone: '',
    message: ''
  });
  const [validator] = useState(new SimpleReactValidator({
    className: 'errorMessage'
  }));
  const changeHandler = e => {
    setForms({ ...forms, [e.target.name]: e.target.value })
    if (validator.allValid()) {
      validator.hideMessages();
    } else {
      validator.showMessages();
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (validator.allValid()) {
      validator.hideMessages();

      const response = await fetch("https://formspree.io/f/xjkyeqzq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forms),
      });

      if (response.ok) {
        alert("Message sent!");
        setForms({
          name: '',
          email: '',
          subject: '',
          phone: '',
          message: ''
        });
      } else {
        alert("Failed to send message. Please try again later.");
      }
    } else {
      validator.showMessages();
    }
  };

  return (
    <form method="post" className="contact-validation-active" onSubmit={(e) => submitHandler(e)} >
      <div className="row align-items-center">
        <div className="col-md-6 col-md-6 col-12">
          <div className="form-group">
            <label>Name*</label>
            <input
              value={forms.name}
              type="text"
              name="name"
              onBlur={(e) => changeHandler(e)}
              onChange={(e) => changeHandler(e)}
              className="form-control"
              placeholder="Your Name" />
            {validator.message('name', forms.name, 'required|alpha_space')}
          </div>
        </div>
        <div className="col-md-6 col-md-6 col-12">
          <div className="form-group">
            <label>Email*</label>
            <input
              value={forms.email}
              type="email"
              name="email"
              onBlur={(e) => changeHandler(e)}
              onChange={(e) => changeHandler(e)}
              className="form-control"
              placeholder="Your Email" />
            {validator.message('email', forms.email, 'required|email')}
          </div>
        </div>
        <div className="col-md-12">
          <div className="fullwidth form-group">
            <label>Message*</label>
            <textarea
              onBlur={(e) => changeHandler(e)}
              onChange={(e) => changeHandler(e)}
              value={forms.message}
              name="message"
              className="form-control"
              placeholder="Message">
            </textarea>
            {validator.message('message', forms.message, 'required')}
          </div>
        </div>
        <div className="col-md-5 order-md-1 order-2 col-12">
          <div className="submit-area">
            <button type="submit" className="theme-btn">Submit now</button>
            <div id="loader">
              <i className="ti-reload"></i>
            </div>
          </div>
        </div>
        <div className="col-md-7 order-md-2 order-1 col-12">
          <div className="contact-info">
            <ul>
              <li><i className="fi flaticon-phone-call"></i> (980)-219-0610</li>
              <li><i className="fi flaticon-mail"></i> fxvarga@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
    </form>

  )
}

export default ContactForm;
