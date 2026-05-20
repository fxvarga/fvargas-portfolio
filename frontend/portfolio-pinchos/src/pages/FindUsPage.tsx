import { useFindUs, useSiteConfig } from '../cms/hooks';

function FindUsPage() {
  const { data: findUs } = useFindUs();
  const { data: siteConfig } = useSiteConfig();

  const hours = findUs?.hours || [
    { days: 'Mon \u2013 Thu', time: '5:00 PM \u2013 12:00 AM' },
    { days: 'Fri \u2013 Sat', time: '5:00 PM \u2013 2:00 AM' },
    { days: 'Sunday', time: '5:00 PM \u2013 11:00 PM' },
  ];

  return (
    <div className="findus-page" data-cms-entity="find-us">
      {/* Header */}
      <header className="menu-header">
        <img
          src={siteConfig?.logoUrl || '/images/logo.png'}
          alt={siteConfig?.restaurantName || 'Pinchos Lounge'}
          className="menu-logo"
        />
        <h1 className="menu-title">Find Us</h1>
        <div className="menu-header-icons" />
      </header>

      {/* Location Image */}
      <div className="findus-image-wrap">
        <img
          src={findUs?.locationImage || 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80'}
          alt={`${findUs?.restaurantName || 'Pinchos Lounge'} exterior`}
          className="findus-image"
          data-cms-field="locationImage"
        />
      </div>

      {/* Address Card */}
      <div className="findus-card">
        <div className="findus-card-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <h3 className="findus-card-title" data-cms-field="restaurantName">
              {findUs?.restaurantName || 'PINCHOS LOUNGE'}
            </h3>
            <p
              className="findus-card-text"
              data-cms-field="addressLines"
              dangerouslySetInnerHTML={{
                __html: (findUs?.addressLines || '123 Main Street<br />Anytown, USA 12345'),
              }}
            />
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="findus-hours">
        <h3 className="findus-hours-title">HOURS</h3>
        <div className="findus-hours-list">
          {hours.map((h, i) => (
            <div key={i} className="findus-hours-row">
              <span>{h.days}</span>
              <span>{h.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="findus-actions">
        <a href={`tel:${findUs?.phone || '+15551234567'}`} className="findus-btn findus-btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          CALL US
        </a>
        <a
          href={findUs?.mapsUrl || 'https://maps.google.com/?q=123+Main+Street+Anytown+USA+12345'}
          target="_blank"
          rel="noopener noreferrer"
          className="findus-btn findus-btn-filled"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          DIRECTIONS
        </a>
      </div>
    </div>
  );
}

export default FindUsPage;
