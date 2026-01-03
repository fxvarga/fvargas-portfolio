import React from 'react';
import { Link } from 'react-router';
import { useFooter } from '../../../shared/hooks/useCMS';

const Footer = () => {
  const { footer, siteConfig } = useFooter();

  // Safely extract logo data
  const logoUrl = footer?.logo?.url;
  const logoAlt = footer?.logo?.alt || 'Logo';

  return (
    <div className="tp-site-footer text-center">
      <div className="container">
        <div className="row">
            <div className="col-12">
            <div className="footer-image">
              <Link className="logo" to="/">
                {logoUrl && <img style={{ width: 100 }} src={logoUrl} alt={logoAlt} className="App-Logo" />}
              </Link>
            </div>
          </div>
          <div className="col-12">
            <div className="link-widget">
              <ul>
                {siteConfig?.socialLinks?.map((link, index) => (
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
