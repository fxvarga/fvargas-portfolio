import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router";
import Homepage from '../features/public/home/HomePage';
import WorkDetailPage from '../features/public/work/WorkDetailPage';
import { ConfigProvider } from './providers/ConfigProvider';
import AppWithApollo from './providers/ApolloProvider';
import { CMSProvider } from '../shared/hooks/useCMS';

// Lazy load admin, OS experience, and blog for code splitting
const AdminApp = lazy(() => import('../features/admin'));
const OSExperience = lazy(() => import('../features/public/os').then(m => ({ default: m.OSExperience })));
const BlogList = lazy(() => import('../features/public/blog/BlogList'));
const BlogPost = lazy(() => import('../features/public/blog/BlogPost'));

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
                
                {/* OS Experience - Hyprland-style tiling window manager */}
                <Route 
                  path="/os" 
                  element={
                    <Suspense fallback={<div style={{ background: '#0a0a0f', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading FV-OS...</div>}>
                      <OSExperience />
                    </Suspense>
                  } 
                />
                
                {/* Blog / Learning Lab */}
                <Route 
                  path="/blog" 
                  element={
                    <Suspense fallback={<div style={{ background: '#0a0a0a', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Learning Lab...</div>}>
                      <BlogList />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/blog/:slug" 
                  element={
                    <Suspense fallback={<div style={{ background: '#0a0a0a', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading post...</div>}>
                      <BlogPost />
                    </Suspense>
                  } 
                />
                
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
