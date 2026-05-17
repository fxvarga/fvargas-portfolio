import { useState } from 'react';

const categories = ['ALL', 'FOOD', 'DRINKS', 'LOUNGE', 'EVENTS'];

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80', category: 'FOOD', alt: 'Grilled kabobs' },
  { src: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80', category: 'DRINKS', alt: 'Cocktail' },
  { src: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80', category: 'LOUNGE', alt: 'Lounge atmosphere' },
  { src: 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=400&q=80', category: 'FOOD', alt: 'Chicken skewers' },
  { src: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80', category: 'DRINKS', alt: 'Hibiscus mojito' },
  { src: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80', category: 'EVENTS', alt: 'Party event' },
  { src: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400&q=80', category: 'FOOD', alt: 'Shrimp kabobs' },
  { src: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80', category: 'LOUNGE', alt: 'Neon bar' },
  { src: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', category: 'FOOD', alt: 'Lamb preparation' },
  { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', category: 'DRINKS', alt: 'Turkish coffee' },
  { src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80', category: 'EVENTS', alt: 'Celebration' },
  { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80', category: 'LOUNGE', alt: 'Lounge seating' },
];

function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filtered = activeCategory === 'ALL'
    ? galleryImages
    : galleryImages.filter((img) => img.category === activeCategory);

  return (
    <div className="gallery-page">
      {/* Header */}
      <header className="menu-header">
        <img src="/images/logo.png" alt="Pinchos Lounge" className="menu-logo" />
        <h1 className="menu-title">Gallery</h1>
        <div className="menu-header-icons">
          <span className="gallery-count">{filtered.length} photos</span>
        </div>
      </header>

      {/* Category Tabs — same style as menu */}
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
            <img src={img.src} alt={img.alt} loading="lazy" />
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
