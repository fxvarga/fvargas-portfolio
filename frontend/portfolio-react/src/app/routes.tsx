import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router";
import Homepage from '../features/public/home/HomePage';
import { DevModeProvider } from './providers/DevModeProvider';
import { ConfigProvider } from './providers/ConfigProvider';
import AppWithApollo from './providers/ApolloProvider';
import { CMSProvider } from '../shared/hooks/useCMS';

// Lazy load admin for code splitting
const AdminApp = lazy(() => import('../features/admin'));

const AllRoute = () => {

  return (
    <div className="App">
      <ConfigProvider>
        <AppWithApollo>
          <CMSProvider>
            <DevModeProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Homepage />} />
                  <Route path="home" element={<Homepage />} />
                  
                  {/* Admin routes - lazy loaded */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <Suspense fallback={<div>Loading admin...</div>}>
                        <AdminApp />
                      </Suspense>
                    } 
                  />
                </Routes>
              </BrowserRouter>
            </DevModeProvider>
          </CMSProvider>
        </AppWithApollo>
      </ConfigProvider>
    </div>
  );
}

export default AllRoute;
