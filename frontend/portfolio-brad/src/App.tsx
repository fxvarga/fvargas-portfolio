import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ImageModeProvider } from './context/ImageModeContext';
import { EditModeProvider, useEditMode } from './context/EditModeContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Work from './pages/Work';
import CaseStudyPage from './pages/CaseStudyPage';
import Process from './pages/Process';
import About from './pages/About';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop';
import ImageModeToggle from './components/ImageModeToggle';
import EditModeToggle from './components/EditModeToggle';
import EditBanner from './components/EditBanner';
import ExportButton from './components/ExportButton';

/** Spacer to push content below the fixed edit banner */
function EditBannerSpacer() {
  const { editMode } = useEditMode();
  if (!editMode) return null;
  return <div data-editor-ui className="h-10" />;
}

function App() {
  return (
    <ThemeProvider>
      <EditModeProvider>
        <ImageModeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <EditBanner />
            <EditBannerSpacer />
            <Header />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/work" element={<Work />} />
                <Route path="/work/:slug" element={<CaseStudyPage />} />
                <Route path="/process" element={<Process />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </main>
            <Footer />
            {/* Floating action stack — bottom-right */}
            <ExportButton />
            <EditModeToggle />
            <ImageModeToggle />
          </BrowserRouter>
        </ImageModeProvider>
      </EditModeProvider>
    </ThemeProvider>
  );
}

export default App;
