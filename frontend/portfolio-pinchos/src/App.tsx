import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { CmsAgentWrapper } from '@fvargas/portfolio-cms-client';
import type { SectionDescriptor } from '@fvargas/cms-agent-panel';
import BottomNavBar from './components/BottomNavBar';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import GalleryPage from './pages/GalleryPage';
import EventsPage from './pages/EventsPage';
import FindUsPage from './pages/FindUsPage';
import MorePage from './pages/MorePage';

const AdminApp = lazy(() => import('./admin'));

const PINCHOS_SECTIONS: SectionDescriptor[] = [
  { selector: '.home-hero',        entityType: 'hero',        label: 'Hero Section' },
  { selector: '.menu-page',        entityType: 'menu-item',   label: 'Menu' },
  { selector: '.gallery-page',     entityType: 'gallery',     label: 'Gallery' },
  { selector: '.events-page',      entityType: 'events-page', label: 'Events' },
  { selector: '.findus-page',      entityType: 'find-us',     label: 'Find Us' },
  { selector: '.more-page',        entityType: 'more-page',   label: 'More' },
  { selector: '.bottom-nav-scroll', entityType: 'navigation', label: 'Navigation' },
];

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Suspense fallback={<div style={{ background: '#f8f9fb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading admin...</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <CmsAgentWrapper
      sections={PINCHOS_SECTIONS}
      getPortfolioId={() => '88888888-8888-8888-8888-888888888888'}
    >
      <div className="bg-dark-bg min-h-screen text-white font-body w-full max-w-[430px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/find-us" element={<FindUsPage />} />
          <Route path="/more" element={<MorePage />} />
        </Routes>
        {!isHome && <BottomNavBar />}
      </div>
    </CmsAgentWrapper>
  );
}

export default App;
