import React, { useState } from 'react';
import ListItem from "@mui/material/List";
import { Link } from 'react-scroll'
import './style.css';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { useConfig } from '../../main-component/State/ConfigProvider';
import { useDevMode } from '../../main-component/State/DevModeProvider';

const menus = [
  {
    id: 1,
    title: 'Home',
    link: 'home',
  },
  {
    id: 2,
    title: 'About',
    link: 'about',
  },
  {
    id: 3,
    title: 'Featured Work',
    link: 'featured-work',
  },
  {
    id: 5,
    title: 'Contact',
    link: 'contact',
  }

]


const MobileMenu = () => {

  const { devMode, toggleDevMode } = useDevMode();
  const { isFeatureEnabled } = useConfig();
  const [menuActive, setMenuState] = useState(false);

  const ClickHandler = () => {
    window.scrollTo(10, 0);
  }

  return (
    <div>
      <div className={`mobileMenu ${menuActive ? "show" : ""}`}>
        <div className="menu-close">
          <div className="clox" onClick={() => setMenuState(!menuActive)}><i className="ti-close"></i></div>
        </div>

        <ul className="responsivemenu">
          {menus.map((item, mn) => {
            return (
              <ListItem key={mn}>
                <Link
                  to={item.link} spy={true} smooth={true} duration={500} onClick={ClickHandler}>{item.title}</Link>
              </ListItem>
            )
          })}
          {/* 👇 Developer Mode Toggle */}

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
                label="Insights"
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
    </div>
  )
}

export default MobileMenu;
