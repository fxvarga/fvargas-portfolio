const TOAST_SLUG = import.meta.env.VITE_TOAST_RESTAURANT_SLUG || 'pinchos-lounge';

const menuLinks = [
  { label: 'LOYALTY & REWARDS', icon: '⭐', href: `https://www.toasttab.com/${TOAST_SLUG}/rewards` },
  { label: 'ORDER HISTORY', icon: '🕐', href: `https://www.toasttab.com/${TOAST_SLUG}/order-history` },
  { label: 'FAVORITES', icon: '❤️', href: `https://www.toasttab.com/${TOAST_SLUG}/favorites` },
  { label: 'GIFT CARDS', icon: '🎁', href: `https://www.toasttab.com/${TOAST_SLUG}/gift-cards` },
  { label: 'CONTACT US', icon: '✉️', href: 'mailto:info@pinchoslounge.com' },
  { label: 'SETTINGS', icon: '⚙️', href: `https://www.toasttab.com/${TOAST_SLUG}/account` },
];

function MorePage() {
  return (
    <div className="more-page">
      {/* Header */}
      <header className="menu-header">
        <img src="/images/logo.png" alt="Pinchos Lounge" className="menu-logo" />
        <h1 className="menu-title">More</h1>
        <div className="menu-header-icons" />
      </header>

      {/* About */}
      <div className="more-about">
        <div className="more-about-img-wrap">
          <img
            src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&q=80"
            alt="Lounge vibe"
            className="more-about-img"
          />
        </div>
        <p className="more-about-text">
          Pinchos Lounge is where bold flavors meet late-night vibes. We're more
          than kabobs &ndash; we're an experience.
        </p>
      </div>

      {/* Menu Links */}
      <div className="more-links">
        {menuLinks.map(({ label, icon, href }) => (
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
            <a href="https://instagram.com/pinchoslounge" target="_blank" rel="noopener noreferrer" className="more-social-btn" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://facebook.com/pinchoslounge" target="_blank" rel="noopener noreferrer" className="more-social-btn" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </a>
            <a href="https://tiktok.com/@pinchoslounge" target="_blank" rel="noopener noreferrer" className="more-social-btn" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MorePage;
