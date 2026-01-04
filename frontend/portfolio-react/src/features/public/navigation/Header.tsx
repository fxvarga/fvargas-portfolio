import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { Link as ScrollLink } from 'react-scroll';
import MobileMenu from './MobileMenu';
import { useConfig } from '../../../app/providers/ConfigProvider';
import { useNavigation } from '../../../shared/hooks/useCMS';
import { FullScreenSearchModal } from '../../../shared/components/FullScreenSearchModal';

interface HeaderProps {
  topbarNone?: string;
  hclass?: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { isFeatureEnabled } = useConfig();
  const { navigation } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

  // Handle OS Experience toggle (kept for future use when OS feature is ready)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOSToggle = () => {
    navigate('/os');
  };

  // Safely extract logo data
  const logoUrl = navigation?.logo?.url;
  const logoAlt = navigation?.logo?.alt || 'Logo';

  return (
    <header id="header" className={props.topbarNone}>
      <div className={`tp-site-header ${props.hclass}`}>
        <nav className="navigation navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-lg-3 col-md-3 col-3 d-lg-none dl-block">
                <div className="mobail-menu">
                  <MobileMenu />
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-6">
                <div className="navbar-header">
                  <RouterLink className="navbar-brand" to="/">
                    {logoUrl && <img src={logoUrl} alt={logoAlt} />}
                  </RouterLink>
                </div>
              </div>
              <div className="col-lg-6 col-md-1 col-1">
                <div id="navbar" className="collapse navbar-collapse navigation-holder">
                  <button className="menu-close"><i className="ti-close"></i></button>
                  <ul className="nav navbar-nav mb-2 mb-lg-0">
                    {navigation?.menuItems?.map((item) => {
                      // "Home" or "hero" link goes to homepage root
                      const isHomeLink = item.link === 'hero' || item.link === 'home';
                      
                      if (isHomePage) {
                        // On homepage, use scroll links
                        return (
                          <li key={item.id}>
                            <ScrollLink 
                              activeClass="active" 
                              to={isHomeLink ? 'home' : item.link} 
                              spy={true} 
                              smooth={true} 
                              duration={500} 
                              offset={-95}
                            >
                              {item.title}
                            </ScrollLink>
                          </li>
                        );
                      } else {
                        // On other pages, use router links with hash
                        return (
                          <li key={item.id}>
                            <RouterLink to={isHomeLink ? '/' : `/#${item.link}`}>
                              {item.title}
                            </RouterLink>
                          </li>
                        );
                      }
                    })}
                    {/* Blog / Learning Lab link */}
                    <li>
                      <RouterLink 
                        to="/blog" 
                        className={location.pathname.startsWith('/blog') ? 'active' : ''}
                      >
                        Learning Lab
                      </RouterLink>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-2 col-2">
                <div className="header-right d-flex align-items-center justify-content-end gap-3">
                  {isFeatureEnabled('Search') && (
                    <div className="header-search-form-wrapper">
                        <button
                        onClick={() => setSearchOpen(true)}
                        className="theme-btn search-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #eee',
                            color: '#666',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                        >
                        <i className="ti-search"></i>
                        <span className="search-text d-lg-none">
                          {navigation?.searchPlaceholder || 'Search...'}
                        </span>
                        </button>
                    </div>
                  )}
{/* OS button temporarily hidden - feature still in development
                  <button
                    onClick={handleOSToggle}
                    className="os-toggle-button"
                    title="Launch OS Experience"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(194, 106, 45, 0.15)',
                      border: '1px solid rgba(194, 106, 45, 0.4)',
                      color: '#c26a2d',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    OS
                  </button>
                  */}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <FullScreenSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)}
        placeholder={navigation?.searchPlaceholder || 'Search...'}
      />
    </header>
  );
};

export default Header;
