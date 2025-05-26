import React, { useState } from 'react';
import { Link } from 'react-scroll';
import MobileMenu from '../MobileMenu/MobileMenu';
import Logo from '../../images/logo.png';
import { useDevMode } from '../../main-component/State/DevModeProvider';
import { Switch, FormControlLabel } from '@mui/material';
import { useConfig } from '../../main-component/State/ConfigProvider';
const Header = (props) => {
  const [menuActive, setMenuState] = useState(false);
  const { devMode, toggleDevMode } = useDevMode();
  const { isFeatureEnabled } = useConfig();

  const SubmitHandler = (e) => {
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
                    <img src={Logo} alt="" />
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
                        INSIGHTS MODE ON
                      </div>

                    )}</Link>
                </div>
              </div>
              <div className="col-lg-6 col-md-1 col-1">
                <div id="navbar" className="collapse navbar-collapse navigation-holder">
                  <button className="menu-close"><i className="ti-close"></i></button>
                  <ul className="nav navbar-nav mb-2 mb-lg-0">
                    <li><Link activeClass="active" to="home" spy={true} smooth={true} duration={500} offset={-100}>Home</Link></li>
                    <li><Link activeClass="active" to="about" spy={true} smooth={true} duration={500} offset={-95}>About</Link></li>
                    <li><Link activeClass="active" to="featured-work" spy={true} smooth={true} duration={500} offset={-95}>Featured Work</Link></li>
                    <li><Link activeClass="active" to="contact" spy={true} smooth={true} duration={500} offset={-95}>Contact</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-2 col-2">
                <div className="header-right d-flex align-items-center justify-content-end gap-3">
                  {/* 👇 Developer Mode Toggle */}
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
                      label="InsightsSwitch"
                      sx={{ marginRight: 0 }}
                    />
                  )}
                  {/* 🔍 Search */}
                  {isFeatureEnabled('Search') && (
                    <div className="header-search-form-wrapper">
                      <div className="cart-search-contact">
                        <button className="search-toggle-btn" onClick={() => setMenuState(!menuActive)}>
                          <i className={`ti-search ${menuActive ? "ti-close" : "ti-search"}`}></i>
                        </button>
                        <div className={`header-search-form ${menuActive ? "header-search-content-toggle" : ""}`}>
                          <form onSubmit={SubmitHandler}>
                            <div>
                              <input type="text" className="form-control" placeholder="Search here..." />
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

