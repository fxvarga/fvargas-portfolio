import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ConfigProvider, CmsProvider, useConfig } from '@fvargas/portfolio-cms-client';
import App from './App';
import './index.css';

/** Pinchos entity types to preload on startup. */
const SINGLETON_TYPES = [
  'site-config',
  'hero',
  'navigation',
  'gallery',
  'events-page',
  'find-us',
  'more-page',
  'footer',
];
const COLLECTION_TYPES = ['menu-category', 'menu-item'];

function CmsBootstrap({ children }: { children: React.ReactNode }) {
  const { config, isLoading } = useConfig();

  // Wait for config.json to load before initializing CMS
  if (isLoading) return null;

  const cmsConfig = {
    apiUrl: config.apiUrl,
    portfolioId: '88888888-8888-8888-8888-888888888888',
  };

  return (
    <CmsProvider
      config={cmsConfig}
      preloadSingletons={SINGLETON_TYPES}
      preloadCollections={COLLECTION_TYPES}
    >
      {children}
    </CmsProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <CmsBootstrap>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CmsBootstrap>
    </ConfigProvider>
  </StrictMode>,
);
