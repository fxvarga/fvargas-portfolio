import { useMorePage, useSiteConfig } from '../cms/hooks';

function MorePage() {
  const { data: more } = useMorePage();
  const { data: siteConfig } = useSiteConfig();

  const links = more?.links || [
    { label: 'CONTACT US', icon: '\u2709\uFE0F', href: 'mailto:info@pinchoslounge.com' },
  ];

  const socialLinks = more?.socialLinks || [
    { platform: 'Instagram', url: 'https://instagram.com/pinchoslounge' },
    { platform: 'Facebook', url: 'https://facebook.com/pinchoslounge' },
    { platform: 'TikTok', url: 'https://tiktok.com/@pinchoslounge' },
  ];

  return (
    <div className="more-page" data-cms-entity="more-page">
      {/* Header */}
      <header className="menu-header">
        <img
          src={siteConfig?.logoUrl || '/images/logo.png'}
          alt={siteConfig?.restaurantName || 'Pinchos Lounge'}
          className="menu-logo"
        />
        <h1 className="menu-title">More</h1>
        <div className="menu-header-icons" />
      </header>

      {/* About */}
      <div className="more-about">
        <div className="more-about-img-wrap">
          <img
            src={more?.aboutImage || 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&q=80'}
            alt="Lounge vibe"
            className="more-about-img"
            data-cms-field="aboutImage"
          />
        </div>
        <p className="more-about-text" data-cms-field="aboutText">
          {more?.aboutText || "Pinchos Lounge is where bold flavors meet late-night vibes. We're more than kabobs \u2013 we're an experience."}
        </p>
      </div>

      {/* Menu Links (Toast links removed) */}
      <div className="more-links">
        {links.map(({ label, icon, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="more-link-item"
          >
            <div className="more-link-left">
              <span className="more-link-icon">{icon}</span>
              <span className="more-link-label">{label}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ))}
      </div>

      {/* Follow Us */}
      <div className="more-social-wrap">
        <div className="more-social-card">
          <p className="more-social-title">Follow Us</p>
          <div className="more-social-links">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="more-social-btn"
                aria-label={link.platform}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'facebook':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
        </svg>
      );
    default:
      return <span>{platform[0]}</span>;
  }
}

export default MorePage;
