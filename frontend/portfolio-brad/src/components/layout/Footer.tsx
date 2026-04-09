import type { SiteConfig, Footer as FooterType } from '../../cms';

interface FooterProps {
  siteConfig: SiteConfig;
  footer: FooterType;
}

export default function Footer({ siteConfig, footer }: FooterProps) {
  const year = new Date().getFullYear();
  const copyright = footer.copyrightTemplate.replace('{year}', String(year));

  return (
    <footer className="bg-dark text-white">
      {/* CTA Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <h3 className="font-heading text-2xl md:text-3xl font-semibold text-center md:text-left">
              {footer.ctaHeading}
            </h3>
            <a
              href={footer.ctaButtonLink}
              className="inline-flex items-center px-8 py-3 bg-orange-500 text-white font-semibold rounded-sm hover:bg-orange-600 transition-all btn-effect font-body"
            >
              <span className="relative z-10">{footer.ctaButtonText}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="font-heading text-2xl font-bold mb-4">
              <span className="text-white">{siteConfig.brandName}</span>
              <span className="text-orange-500">{siteConfig.brandHighlight}</span>
            </div>
            <p className="text-gray-400 font-body leading-relaxed">{footer.tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 font-body">
              <li><a href="#about" className="text-gray-400 hover:text-orange-500 transition-colors">About</a></li>
              <li><a href="#services" className="text-gray-400 hover:text-orange-500 transition-colors">Services</a></li>
              <li><a href="#portfolio" className="text-gray-400 hover:text-orange-500 transition-colors">Portfolio</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-orange-500 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-2 font-body">
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-gray-400 hover:text-orange-500 transition-colors">
                  {siteConfig.contactEmail}
                </a>
              </li>
              <li>
                <a href={`tel:${siteConfig.contactPhone}`} className="text-gray-400 hover:text-orange-500 transition-colors">
                  {siteConfig.contactPhone}
                </a>
              </li>
              <li className="text-gray-400">{siteConfig.location}</li>
            </ul>
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {footer.socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all"
                  aria-label={link.platform}
                >
                  {link.icon === 'linkedin' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )}
                  {link.icon === 'email' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm font-body">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
