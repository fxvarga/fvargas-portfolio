import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNavBar from './components/BottomNavBar';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import GalleryPage from './pages/GalleryPage';
import EventsPage from './pages/EventsPage';
import FindUsPage from './pages/FindUsPage';
import MorePage from './pages/MorePage';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
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
  );
}

export default App;
