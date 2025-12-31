import React, { useState } from 'react';
import { Link } from 'react-scroll';
import MobileMenu from './MobileMenu';
import { useDevMode } from '../../../app/providers/DevModeProvider';
import { Switch, FormControlLabel } from '@mui/material';
import { useConfig } from '../../../app/providers/ConfigProvider';
import { useNavigation } from '../../../shared/hooks/useCMS';

interface HeaderProps {
  topbarNone?: string;
  hclass?: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const [menuActive, setMenuState] = useState(false);
  const { devMode, toggleDevMode } = useDevMode();
  const { isFeatureEnabled } = useConfig();
  const { navigation } = useNavigation();

  const SubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const ClickHandler = () => {
    window.scrollTo(10, 0);
  };

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
                  <Link onClick={ClickHandler} className="navbar-brand" to="/">
                    {navigation && <img src={navigation.logo.url} alt={navigation.logo.alt} />}
                    {devMode && isFeatureEnabled('DevMode') && (
                      <div className="dev-mode-indicator ml-2" style={{
                        color: '#FF5722',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        border: '1px solid #FF5722',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        display: 'inline-block'
                      }}>
                        {navigation?.devModeLabel || 'INSIGHTS MODE ON'}
                      </div>
                    )}
                  </Link>
                </div>
              </div>
              <div className="col-lg-6 col-md-1 col-1">
                <div id="navbar" className="collapse navbar-collapse navigation-holder">
                  <button className="menu-close"><i className="ti-close"></i></button>
                  <ul className="nav navbar-nav mb-2 mb-lg-0">
                    {navigation?.menuItems.map((item) => (
                      <li key={item.id}>
                        <Link activeClass="active" to={item.link} spy={true} smooth={true} duration={500} offset={-95}>
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-2 col-2">
                <div className="header-right d-flex align-items-center justify-content-end gap-3">
                  {isFeatureEnabled('DevMode') && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={devMode}
                          onChange={toggleDevMode}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#FF5722',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#FF5722',
                            },
                            '& .MuiSwitch-track': {
                              backgroundColor: '#888',
                              opacity: 1,
                            },
                          }}
                        />
                      }
                      label={navigation?.insightsLabel || 'Insights'}
                      sx={{ marginRight: 0 }}
                    />
                  )}
                  {isFeatureEnabled('Search') && (
                    <div className="header-search-form-wrapper">
                      <div className="cart-search-contact">
                        <button className="search-toggle-btn" onClick={() => setMenuState(!menuActive)}>
                          <i className={`ti-search ${menuActive ? "ti-close" : "ti-search"}`}></i>
                        </button>
                        <div className={`header-search-form ${menuActive ? "header-search-content-toggle" : ""}`}>
                          <form onSubmit={SubmitHandler}>
                            <div>
                              <input type="text" className="form-control" placeholder={navigation?.searchPlaceholder || 'Search here...'} />
                              <button type="submit"><i className="fi ti-search"></i></button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
