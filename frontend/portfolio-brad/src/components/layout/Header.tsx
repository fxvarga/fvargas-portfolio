import { useState, useEffect } from 'react';
import type { SiteConfig, Navigation } from '../../cms';

interface HeaderProps {
  siteConfig: SiteConfig;
  navigation: Navigation;
}

export default function Header({ siteConfig, navigation }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-3' : 'bg-light py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-1 font-heading text-2xl font-bold">
              <span className="text-dark">{siteConfig.brandName}</span>
              <span className="text-orange-500">{siteConfig.brandHighlight}</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navigation.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors font-body"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <button
              onClick={() => handleNavClick(navigation.ctaLink)}
              className="hidden md:inline-flex items-center px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-sm hover:bg-orange-600 transition-all btn-effect font-body"
            >
              <span className="relative z-10">{navigation.ctaText}</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
              aria-expanded={isMobileOpen}
            >
              <span className={`block w-6 h-0.5 bg-dark transition-all ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-dark transition-all ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-dark transition-all ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Drawer */}
      <div className={`mobile-menu-drawer ${isMobileOpen ? 'active' : ''}`} role="dialog" aria-label="Mobile navigation">
        <div className="flex justify-between items-center mb-8">
          <span className="font-heading text-xl font-bold">
            <span className="text-dark">{siteConfig.brandName}</span>
            <span className="text-orange-500">{siteConfig.brandHighlight}</span>
          </span>
          <button onClick={() => setIsMobileOpen(false)} className="text-2xl text-gray-500" aria-label="Close menu">&times;</button>
        </div>
        <nav className="flex flex-col gap-2">
          {navigation.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              className="block text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors font-body"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => handleNavClick(navigation.ctaLink)}
            className="mt-4 px-6 py-3 bg-orange-500 text-white text-center font-semibold rounded-sm hover:bg-orange-600 transition-all font-body"
          >
            {navigation.ctaText}
          </button>
        </nav>
      </div>
    </>
  );
}
