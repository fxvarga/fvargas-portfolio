import { Link } from "react-router-dom";

const TOAST_SLUG =
  import.meta.env.VITE_TOAST_RESTAURANT_SLUG || "pinchos-lounge";

function HomePage() {
  return (
    <div className="homepage-wrap">
      <picture className="homepage-bg">
        <source media="(min-width: 431px)" srcSet="/images/homepage-bg-desktop.png" />
        <img src="/images/homepage-bg-mobile.png" alt="" />
      </picture>
      <div className="homepage">
      <div className="home-content">

      {/* ── Group 1: Hero ─────────────────────── */}
      <div className="home-group home-hero">
        <div className="hero-late-night">Late-Night</div>
        <h1 className="hero-kabobs">KABOBS</h1>
        <div className="hero-vibes">WITH LOUNGE VIBES</div>
      </div>

      {/* ── Group 2: Slogan + Address ─────────── */}
      <div className="home-group home-info">
        <p className="hero-caption">
          Savor bold flavors. Vibe late.
          <br />
          Live it up. Only at Pinchos Lounge.
        </p>
        <div className="home-address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>315 Peck St, New Haven, CT</span>
        </div>
      </div>

      {/* ── Group 3: CTAs + Toast ─────────────── */}
      <div className="home-group home-actions">
        <Link to="/menu" className="cta-menu">
          VIEW MENU
        </Link>
        <a
          href={`https://order.toasttab.com/${TOAST_SLUG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-order"
        >
          ORDER ONLINE
        </a>
        <div className="powered-toast">
          Powered by <strong>toast</strong>
        </div>
      </div>

      </div>{/* end home-content */}

      {/* ── Bottom nav ───────────────────────── */}
      <nav className="bottom-nav">
        <NavItem icon="home" label="HOME" active />
        <NavItem icon="menu" label="MENU" to="/menu" />
        <NavItem icon="gallery" label="GALLERY" to="/gallery" />
        <NavItem icon="events" label="EVENTS" to="/events" />
        <NavItem icon="findus" label="FIND US" to="/find-us" />
        <NavItem icon="more" label="MORE" to="/more" />
      </nav>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  to,
}: {
  icon: string;
  label: string;
  active?: boolean;
  to?: string;
}) {
  const Wrapper = to ? Link : "div";
  const props = to ? { to } : {};
  return (
    // @ts-ignore
    <Wrapper {...props} className={`nav-item ${active ? "nav-active" : ""}`}>
      <NavIcon name={icon} />
      <span>{label}</span>
    </Wrapper>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    menu: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4 4 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
      </svg>
    ),
    gallery: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
      </svg>
    ),
    events: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    findus: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
      </svg>
    ),
    more: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    ),
  };
  return <span className="nav-icon">{icons[name]}</span>;
}

export default HomePage;
