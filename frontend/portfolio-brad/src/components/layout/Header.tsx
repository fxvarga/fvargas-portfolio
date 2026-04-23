import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig, navigation } from '../../content/site';
import { useEditMode } from '../../context/EditModeContext';
import Editable from '../Editable';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { editMode } = useEditMode();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-30 transition-all duration-300 ${
          editMode ? 'top-10' : 'top-0'
        } ${
          isScrolled ? 'bg-bg-alt/95 backdrop-blur-sm shadow-sm py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1 font-heading text-2xl font-bold">
              <Editable path="site.brandName" className="text-txt">{siteConfig.brandName}</Editable>
              <Editable path="site.brandHighlight" className="text-primary">{siteConfig.brandHighlight}</Editable>
            </Link>

            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navigation.links.map((link, i) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors font-body ${
                    location.pathname === link.href
                      ? 'text-primary'
                      : 'text-txt-muted hover:text-primary'
                  }`}
                >
                  <Editable path={`nav.links.${i}.label`}>{link.label}</Editable>
                </Link>
              ))}
            </nav>

            <Link to={navigation.ctaLink} className="hidden md:inline-flex btn-primary text-sm">
              <Editable path="nav.ctaText">{navigation.ctaText}</Editable>
            </Link>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
              aria-expanded={isMobileOpen}
            >
              <span className={`block w-6 h-0.5 bg-txt transition-all ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-txt transition-all ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-txt transition-all ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-menu-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <div className={`mobile-menu-drawer ${isMobileOpen ? 'active' : ''}`} role="dialog" aria-label="Mobile navigation">
        <div className="flex justify-between items-center mb-8">
          <span className="font-heading text-xl font-bold">
            <span className="text-txt">{siteConfig.brandName}</span>
            <span className="text-primary">{siteConfig.brandHighlight}</span>
          </span>
          <button onClick={() => setIsMobileOpen(false)} className="text-2xl text-txt-muted" aria-label="Close menu">&times;</button>
        </div>
        <nav className="flex flex-col gap-2">
          {navigation.links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`block px-4 py-3 text-base font-medium rounded transition-colors font-body ${
                location.pathname === link.href
                  ? 'text-primary bg-primary/10'
                  : 'text-txt-muted hover:text-primary hover:bg-primary/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to={navigation.ctaLink} className="mt-4 btn-primary text-center justify-center">
            {navigation.ctaText}
          </Link>
        </nav>
      </div>
    </>
  );
}
