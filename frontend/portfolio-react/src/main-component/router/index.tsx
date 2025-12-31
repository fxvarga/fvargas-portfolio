import React from 'react';
import { BrowserRouter, Routes, Route, } from "react-router";
import Homepage from '../HomePage/HomePage';
import { DevModeProvider } from '../State/DevModeProvider';
import { ConfigProvider } from '../State/ConfigProvider';
import AppWithApollo from '../State/AppWithApollo';
import { CMSProvider } from '../../context/CMSContext';

const AllRoute = () => {

  return (
    <div className="App">
      <ConfigProvider>
        <CMSProvider>
          <DevModeProvider>
            <AppWithApollo>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="home" element={<Homepage />} />
                </Routes>
              </BrowserRouter>
            </AppWithApollo>
          </DevModeProvider>
        </CMSProvider>
      </ConfigProvider>
    </div>
  );
}

export default AllRoute;
