import Container from '../ui/Container';
import type { SiteConfig, Footer as FooterType } from '../../cms';

interface FooterProps {
  siteConfig: SiteConfig;
  footer: FooterType;
}

export default function Footer({ siteConfig, footer }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={siteConfig.logoSrc} alt={siteConfig.logoAlt} className="w-8 h-8" />
              <span className="font-heading font-bold text-xl text-white">
                {siteConfig.brandName}<span className="text-primary-400">{siteConfig.brandHighlight}</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {footer.tagline}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">{footer.servicesHeading}</h4>
            <ul className="space-y-2 text-sm">
              {footer.serviceLinks.map((link, i) => (
                <li key={i}><a href={link.href} className="hover:text-white transition-colors">{link.text}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">{footer.contactHeading}</h4>
            <ul className="space-y-2 text-sm">
              {footer.contactLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{footer.copyrightTemplate.replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </Container>
    </footer>
  );
}
