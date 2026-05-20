import { useState } from 'react';
import { useGallery, useSiteConfig } from '../cms/hooks';

function GalleryPage() {
  const { data: gallery } = useGallery();
  const { data: siteConfig } = useSiteConfig();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const rawCategories = gallery?.categories || [{name:'ALL'}, {name:'FOOD'}, {name:'DRINKS'}, {name:'LOUNGE'}, {name:'EVENTS'}];
  const categories = rawCategories.map((c: string | { name: string }) => typeof c === 'string' ? c : c.name);
  const allImages = gallery?.images || [];
  const filtered = activeCategory === 'ALL'
    ? allImages
    : allImages.filter((img) => img.category === activeCategory);

  return (
    <div className="gallery-page" data-cms-entity="gallery">
      {/* Header */}
      <header className="menu-header">
        <img
          src={siteConfig?.logoUrl || '/images/logo.png'}
          alt={siteConfig?.restaurantName || 'Pinchos Lounge'}
          className="menu-logo"
        />
        <h1 className="menu-title">Gallery</h1>
        <div className="menu-header-icons">
          <span className="gallery-count">{filtered.length} photos</span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="menu-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`menu-tab ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div className="gallery-grid">
        {filtered.map((img, i) => (
          <div
            key={i}
            className={`gallery-item ${i % 5 === 0 ? 'gallery-item-tall' : ''}`}
            onClick={() => setSelectedImage(i)}
          >
            <img src={img.src} alt={img.alt} loading="lazy" data-cms-field="src" />
            <div className="gallery-overlay">
              <span className="gallery-cat-label">{img.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="gallery-lightbox" onClick={() => setSelectedImage(null)}>
          <img src={filtered[selectedImage].src} alt={filtered[selectedImage].alt} />
          <button className="gallery-lightbox-close" onClick={() => setSelectedImage(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
