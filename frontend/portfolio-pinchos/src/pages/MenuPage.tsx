import { useState, useMemo } from 'react';
import { useSiteConfig, useMenuCategories, useMenuItems } from '../cms/hooks';

function MenuPage() {
  const { data: siteConfig } = useSiteConfig();
  const { records: categoryRecords } = useMenuCategories();
  const { records: itemRecords } = useMenuItems();

  // Sort categories by sortOrder
  const categories = useMemo(() => {
    const cats = categoryRecords.map(r => r.data);
    cats.sort((a, b) => a.sortOrder - b.sortOrder);
    return cats;
  }, [categoryRecords]);

  // Group items by categorySlug
  const itemsByCategory = useMemo(() => {
    const map: Record<string, typeof itemRecords> = {};
    for (const record of itemRecords) {
      const slug = record.data.categorySlug;
      if (!map[slug]) map[slug] = [];
      map[slug].push(record);
    }
    // Sort within each category
    for (const slug of Object.keys(map)) {
      map[slug].sort((a, b) => a.data.sortOrder - b.data.sortOrder);
    }
    return map;
  }, [itemRecords]);

  const categoryNames = categories.length > 0
    ? categories.map(c => c.slug)
    : ['kabobs'];

  const [activeSlug, setActiveSlug] = useState(categoryNames[0] || 'kabobs');

  const activeRecords = itemsByCategory[activeSlug] || [];

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="menu-header">
        <img
          src={siteConfig?.logoUrl || '/images/logo.png'}
          alt={siteConfig?.restaurantName || 'Pinchos Lounge'}
          className="menu-logo"
          data-cms-entity="site-config"
          data-cms-field="logoUrl"
        />
        <h1 className="menu-title">Menu</h1>
        <div className="menu-header-icons">
          <button className="menu-icon-btn" aria-label="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="menu-tabs" data-cms-entity="menu-category">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveSlug(cat.slug)}
            className={`menu-tab ${activeSlug === cat.slug ? 'active' : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-items">
        {activeRecords.map((record) => {
          const item = record.data;
          return (
          <div
            key={item.name}
            className="menu-card"
            data-cms-entity="menu-item"
            data-cms-record-id={record.id}
            data-cms-record-name={item.name}
          >
            <img
              src={item.image}
              alt={item.name}
              className="menu-card-img"
              data-cms-field="image"
            />
            <div className="menu-card-body">
              <div className="menu-card-top">
                <div className="menu-card-info">
                  <h3 className="menu-card-name" data-cms-field="name">{item.name}</h3>
                  <p className="menu-card-desc" data-cms-field="description">{item.description}</p>
                  {item.tag && (
                    <span className="menu-card-tag">&#x1F331; {item.tag}</span>
                  )}
                </div>
                <div className="menu-card-right">
                  <span className="menu-card-price" data-cms-field="price">{item.price}</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default MenuPage;
