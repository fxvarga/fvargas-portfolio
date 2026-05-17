import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'HOME', icon: HomeIcon },
  { to: '/menu', label: 'MENU', icon: MenuIcon },
  { to: '/gallery', label: 'GALLERY', icon: GalleryIcon },
  { to: '/events', label: 'EVENTS', icon: EventsIcon },
  { to: '/find-us', label: 'FIND US', icon: FindUsIcon },
  { to: '/more', label: 'MORE', icon: MoreIcon },
];

function BottomNavBar() {
  return (
    <nav className="bottom-nav-scroll">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'nav-active' : ''}`
          }
        >
          <span className="nav-icon"><Icon /></span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4 4 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function FindUsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export default BottomNavBar;
