import { useEventsPage, useSiteConfig } from '../cms/hooks';

function EventsPage() {
  const { data: events } = useEventsPage();
  const { data: siteConfig } = useSiteConfig();

  return (
    <div className="events-page" data-cms-entity="events-page">
      {/* Header */}
      <header className="menu-header">
        <img
          src={siteConfig?.logoUrl || '/images/logo.png'}
          alt={siteConfig?.restaurantName || 'Pinchos Lounge'}
          className="menu-logo"
        />
        <h1 className="menu-title">Events</h1>
        <div className="menu-header-icons" />
      </header>

      {/* Hero */}
      <div className="events-hero">
        <h2 className="events-heading" data-cms-field="heading">
          {events?.heading || 'EVENTS &\nCATERING'}
        </h2>
        <p className="events-script" data-cms-field="scriptLine">
          {events?.scriptLine || "Let's Plan Something Unforgettable"}
        </p>
        <p className="events-desc" data-cms-field="description">
          {events?.description || 'From private parties to corporate events, we bring the flavor, the vibe, and the unforgettable experience.'}
        </p>
      </div>

      {/* Services */}
      <div className="events-services">
        {(events?.services || defaultServices).map((svc, i) => (
          <ServiceCard key={i} icon={svc.icon} label={svc.label} desc={svc.desc} />
        ))}
      </div>

      {/* Image Collage */}
      <div className="events-collage">
        {(events?.collageImages || defaultCollage).map((img, i) => (
          <img key={i} src={img.src} alt={img.alt} data-cms-field={`collageImages[${i}].src`} />
        ))}
      </div>

      {/* CTA */}
      <div className="events-cta-wrap">
        <a href={`mailto:${events?.ctaEmail || 'events@pinchoslounge.com'}`} className="menu-start-order">
          <span data-cms-field="ctaLabel">{events?.ctaLabel || 'GET IN TOUCH'}</span> <span>&rsaquo;</span>
        </a>
      </div>
    </div>
  );
}

const defaultServices = [
  { icon: '\uD83C\uDF89', label: 'Private Parties', desc: 'Birthdays, anniversaries, celebrations \u2014 we handle it all.' },
  { icon: '\uD83C\uDFE2', label: 'Corporate Events', desc: 'Team events, product launches, networking nights.' },
  { icon: '\uD83C\uDF7D\uFE0F', label: 'Catering Services', desc: 'Full-service catering for any occasion, any size.' },
  { icon: '\uD83D\uDCCB', label: 'Custom Menus', desc: "Tailored menus crafted for your event's needs." },
];

const defaultCollage = [
  { src: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=300&q=80', alt: 'Event setup' },
  { src: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80', alt: 'Cocktails' },
  { src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80', alt: 'Catering food' },
  { src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80', alt: 'Party lights' },
];

function ServiceCard({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="events-service-card">
      <span className="events-service-icon">{icon}</span>
      <div>
        <h3 className="events-service-label">{label}</h3>
        <p className="events-service-desc">{desc}</p>
      </div>
    </div>
  );
}

export default EventsPage;
