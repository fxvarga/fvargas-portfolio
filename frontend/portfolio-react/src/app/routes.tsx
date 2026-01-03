import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router";
import Homepage from '../features/public/home/HomePage';
import WorkDetailPage from '../features/public/work/WorkDetailPage';
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
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Homepage />} />
                <Route path="home" element={<Homepage />} />
                <Route path="/work/:slug" element={<WorkDetailPage />} />
                
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
          </CMSProvider>
        </AppWithApollo>
      </ConfigProvider>
    </div>
  );
}

export default AllRoute;
