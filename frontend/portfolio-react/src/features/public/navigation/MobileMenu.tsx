import React, { useState } from 'react';
import ListItem from "@mui/material/List";
import { Link } from 'react-scroll';
import { useNavigate } from 'react-router';
import './MobileMenu.css';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { useConfig } from '../../../app/providers/ConfigProvider';
import { useDevMode } from '../../../app/providers/DevModeProvider';
import { useNavigation } from '../../../shared/hooks/useCMS';
import { FullScreenSearchModal } from '../../../shared/components/FullScreenSearchModal';

const MobileMenu = () => {
  const { devMode, toggleDevMode } = useDevMode();
  const { isFeatureEnabled } = useConfig();
  const { navigation } = useNavigation();
  const [menuActive, setMenuState] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const ClickHandler = () => {
    window.scrollTo(10, 0);
  };
  
  const handleOSToggle = () => {
    setMenuState(false);
    navigate('/os');
  };

  return (
    <div>
      <div className={`mobileMenu ${menuActive ? "show" : ""}`}>
        <div className="menu-close">
          <div className="clox" onClick={() => setMenuState(!menuActive)}><i className="ti-close"></i></div>
        </div>

        <ul className="responsivemenu">
          {isFeatureEnabled('Search') && (
             <li style={{ padding: '0 15px 15px 15px' }}>
                <button
                  onClick={() => {
                    setMenuState(false);
                    setSearchOpen(true);
                  }}
                  className="theme-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  <i className="ti-search"></i>
                  {navigation?.searchPlaceholder || 'Search...'}
                </button>
             </li>
          )}
          
          <li style={{ padding: '0 15px' }}>
             <button
                onClick={handleOSToggle}
                className="theme-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '14px',
                  marginBottom: '15px'
                }}
             >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'white'}}>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Launch OS Experience
             </button>
          </li>

          {navigation?.menuItems?.map((item) => (
            <ListItem key={item.id}>
              <Link to={item.link} spy={true} smooth={true} duration={500} onClick={ClickHandler}>
                {item.title}
              </Link>
            </ListItem>
          ))}
          
          {isFeatureEnabled('DevMode') && (
            <Box
              sx={{
                padding: '5px',
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={devMode}
                    onChange={toggleDevMode}
                    size="small"
                    sx={{
                      padding: '10px',
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
                sx={{ padding: 2, marginRight: 0 }}
              />
            </Box>
          )}
        </ul>
      </div>

      <div className="showmenu" onClick={() => setMenuState(!menuActive)}>
        <button type="button" className="navbar-toggler open-btn">
          <span className="icon-bar first-angle"></span>
          <span className="icon-bar middle-angle"></span>
          <span className="icon-bar last-angle"></span>
        </button>
      </div>

      <FullScreenSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)}
        placeholder={navigation?.searchPlaceholder || 'Search...'}
      />
    </div>
  );
};

export default MobileMenu;
