import { useState } from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import type { SiteConfig, Navigation } from '../../cms';

interface NavbarProps {
  siteConfig: SiteConfig;
  navigation: Navigation;
}

export default function Navbar({ siteConfig, navigation }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <img src={siteConfig.logoSrc} alt={siteConfig.logoAlt} className="w-8 h-8" />
            <span className="font-heading font-bold text-xl text-gray-900">
              {siteConfig.brandName}<span className="text-primary-600">{siteConfig.brandHighlight}</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-primary-600 transition-colors font-medium text-sm"
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" onClick={() => {
              const target = navigation.ctaLink.replace('#', '');
              document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
            }}>
              {navigation.ctaText}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/>
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-4">
            {navigation.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 text-gray-600 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setMobileOpen(false);
                const target = navigation.ctaLink.replace('#', '');
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {navigation.ctaText}
            </Button>
          </div>
        )}
      </Container>
    </nav>
  );
}
