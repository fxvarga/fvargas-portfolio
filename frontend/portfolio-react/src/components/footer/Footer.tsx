import React from 'react';
import { Link } from 'react-router';
import { useFooter } from '../../context/CMSContext';

const Footer = () => {
  const { footer, siteConfig } = useFooter();

  return (
    <div className="tp-site-footer text-center">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="footer-image">
              <Link className="logo" to="/">
                {footer && <img style={{ width: 100 }} src={footer.logo.url} alt={footer.logo.alt} className="App-Logo" />}
              </Link>
            </div>
          </div>
          <div className="col-12">
            <div className="link-widget">
              <ul>
                {siteConfig?.socialLinks.map((link, index) => (
                  <li key={index}>
                    <Link to={link.url}><i className={link.icon}></i></Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-12">
            <div className="copyright">
              <p>{siteConfig?.copyright}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
