function EventsPage() {
  return (
    <div className="events-page">
      {/* Header */}
      <header className="menu-header">
        <img src="/images/logo.png" alt="Pinchos Lounge" className="menu-logo" />
        <h1 className="menu-title">Events</h1>
        <div className="menu-header-icons" />
      </header>

      {/* Hero */}
      <div className="events-hero">
        <h2 className="events-heading">EVENTS &amp;<br />CATERING</h2>
        <p className="events-script">Let's Plan Something Unforgettable</p>
        <p className="events-desc">
          From private parties to corporate events, we bring the flavor, the vibe,
          and the unforgettable experience.
        </p>
      </div>

      {/* Services */}
      <div className="events-services">
        <ServiceCard icon="🎉" label="Private Parties" desc="Birthdays, anniversaries, celebrations — we handle it all." />
        <ServiceCard icon="🏢" label="Corporate Events" desc="Team events, product launches, networking nights." />
        <ServiceCard icon="🍽️" label="Catering Services" desc="Full-service catering for any occasion, any size." />
        <ServiceCard icon="📋" label="Custom Menus" desc="Tailored menus crafted for your event's needs." />
      </div>

      {/* Image Collage */}
      <div className="events-collage">
        <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=300&q=80" alt="Event setup" />
        <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80" alt="Cocktails" />
        <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80" alt="Catering food" />
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80" alt="Party lights" />
      </div>

      {/* CTA */}
      <div className="events-cta-wrap">
        <a href="mailto:events@pinchoslounge.com" className="menu-start-order">
          GET IN TOUCH <span>&rsaquo;</span>
        </a>
      </div>
    </div>
  );
}

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
