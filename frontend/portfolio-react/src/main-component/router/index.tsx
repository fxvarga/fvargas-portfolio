import React from 'react';
import { BrowserRouter, Routes, Route, } from "react-router";
import Homepage from '../HomePage/HomePage';
import { DevModeProvider } from '../State/DevModeProvider';
import { ConfigProvider } from '../State/ConfigProvider';
import AppWithApollo from '../State/AppWithApollo';

const AllRoute = () => {

  return (
    <div className="App">
      <ConfigProvider>
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
      </ConfigProvider>
    </div>
  );
}

export default AllRoute;
