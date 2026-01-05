# Building a Lightroom-Style Photo Gallery with React

Photo galleries are essential for portfolios, photography sites, and product showcases. In this tutorial, we'll build a professional gallery component inspired by Adobe Lightroom, featuring a responsive grid layout, smooth modal transitions, keyboard navigation, and zoom functionality.

## What We're Building

Our photo gallery implementation includes:

- **Responsive CSS Grid layout** that adapts to any screen size
- **Lightbox modal** with smooth open/close animations
- **Keyboard navigation** (arrow keys, Escape, Space for zoom)
- **Click-to-zoom** with pan functionality for image details
- **EXIF metadata display** for photography enthusiasts
- **Lazy loading** for optimized performance

TIP: Click any image in the demo above to open the lightbox. Try using your keyboard to navigate between images!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of CSS Grid
- Familiarity with React hooks (useState, useEffect, useCallback, useRef)

## Step 1: Component Structure and Types

Let's start by defining our data structure and component interfaces:

```tsx
interface ImageData {
  id: number;
  src: string;           // Thumbnail URL
  fullSrc: string;       // Full resolution URL
  alt: string;
  title: string;
  metadata: {
    camera: string;
    aperture: string;
    shutter: string;
    iso: string;
  };
}

interface GalleryProps {
  images: ImageData[];
  columns?: number;
  gap?: number;
  onImageClick?: (image: ImageData, index: number) => void;
}

interface LightboxProps {
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  showMetadata?: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}
```

This separation allows us to use different image resolutions for thumbnails vs. full view, improving initial load times.

## Step 2: The Gallery Grid Component

The grid uses CSS Grid for a clean, responsive layout with smooth loading animations:

```tsx
const PhotoGalleryGrid: React.FC<GalleryProps> = ({
  images,
  columns = 4,
  gap = 8,
  onImageClick,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleImageLoad = (id: number) => {
    setLoadedImages(prev => new Set(prev).add(id));
  };

  return (
    <div 
      className="photo-gallery-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`gallery-item ${loadedImages.has(image.id) ? 'loaded' : ''}`}
          onClick={() => onImageClick?.(image, index)}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            onLoad={() => handleImageLoad(image.id)}
          />
          <div className="gallery-item-overlay">
            <span className="gallery-item-title">{image.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

NOTE: We track loaded images in a Set to trigger opacity transitions only after each image has loaded, preventing layout shift.

## Step 3: Staggered Animation CSS

The staggered fade-in effect makes the gallery feel polished:

```css
.gallery-item {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.95);
  animation: fadeInUp 0.5s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-item:hover img {
  transform: scale(1.05);
}
```

The `cubic-bezier(0.16, 1, 0.3, 1)` timing function creates a smooth, slightly bouncy hover effect.

## Step 4: The Lightbox Modal

The lightbox is the heart of our gallery. It handles image display, navigation, and zoom:

```tsx
const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  showMetadata = true,
  onClose,
  onNavigate,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsLoading(true);
      setIsZoomed(false);
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setIsLoading(true);
      setIsZoomed(false);
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, images.length, onNavigate]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className={`lightbox-overlay ${isOpen ? 'open' : ''}`}>
      <button className="lightbox-close" onClick={onClose}>×</button>
      
      <button className="lightbox-nav prev" onClick={goToPrevious}>‹</button>
      <button className="lightbox-nav next" onClick={goToNext}>›</button>

      <div className="lightbox-content" onClick={() => setIsZoomed(z => !z)}>
        <img
          ref={imageRef}
          src={currentImage.fullSrc}
          alt={currentImage.alt}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <div className="lightbox-footer">
        <span className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </span>
      </div>
    </div>
  );
};
```

## Step 5: Keyboard Navigation

Adding keyboard support makes the gallery accessible and professional:

```tsx
useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case ' ':
        e.preventDefault();
        setIsZoomed(z => !z);
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, goToPrevious, goToNext, onClose]);
```

WARNING: Always call `e.preventDefault()` for Space to prevent page scrolling when toggling zoom.

## Step 6: Click-to-Zoom with Pan

The zoom feature lets users inspect image details. When zoomed, mouse movement pans the view:

```tsx
const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!isZoomed || !imageRef.current) return;

  const rect = imageRef.current.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  setZoomPosition({ x, y });
};

// In the JSX:
<img
  style={isZoomed ? {
    transform: 'scale(2)',
    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
  } : undefined}
/>
```

This technique uses `transform-origin` to center the zoomed view on the cursor position.

## Step 7: Preventing Body Scroll

When the lightbox is open, we should prevent background scrolling:

```tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

## Step 8: Complete Lightbox Styling

Here's the key CSS for the lightbox overlay and animations:

```css
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.lightbox-overlay.open {
  opacity: 1;
  visibility: visible;
}

.lightbox-content {
  max-width: calc(100vw - 200px);
  max-height: calc(100vh - 160px);
  cursor: zoom-in;
}

.lightbox-content.zoomed {
  cursor: zoom-out;
}

.lightbox-content img {
  max-width: 100%;
  max-height: calc(100vh - 160px);
  object-fit: contain;
  transition: transform 0.3s ease;
}

.lightbox-content.zoomed img {
  transform: scale(2);
}
```

## Step 9: Metadata Display

Photographers love EXIF data! Here's how to display it:

```tsx
{showMetadata && (
  <div className="lightbox-metadata">
    <span className="metadata-title">{currentImage.title}</span>
    <div className="metadata-details">
      <span>{currentImage.metadata.camera}</span>
      <span>{currentImage.metadata.aperture}</span>
      <span>{currentImage.metadata.shutter}</span>
      <span>{currentImage.metadata.iso}</span>
    </div>
  </div>
)}
```

```css
.metadata-details {
  display: flex;
  gap: 0.5rem;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
}
```

## Usage Example

Here's how to use the complete gallery in your application:

```tsx
const MyGallery = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    {
      id: 1,
      src: '/thumbnails/photo-1.jpg',
      fullSrc: '/full/photo-1.jpg',
      alt: 'Mountain sunset',
      title: 'Alpine Glow',
      metadata: { camera: 'Sony A7III', aperture: 'f/8', shutter: '1/250s', iso: 'ISO 100' }
    },
    // ... more images
  ];

  return (
    <>
      <PhotoGalleryGrid
        images={images}
        columns={4}
        gap={8}
        onImageClick={(_, index) => {
          setCurrentIndex(index);
          setLightboxOpen(true);
        }}
      />
      <Lightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </>
  );
};
```

## Performance Considerations

WARNING: Always use optimized image sizes! Loading full-resolution images as thumbnails will severely impact performance.

Best practices for gallery performance:

1. **Use responsive images** - Serve different sizes based on viewport
2. **Lazy load thumbnails** - The `loading="lazy"` attribute handles this
3. **Preload adjacent images** - When viewing image N, preload N-1 and N+1
4. **Use WebP format** - Better compression than JPEG/PNG
5. **Consider a CDN** - Services like Cloudinary or imgix can resize on-the-fly

## Accessibility

For screen reader users and motor-impaired visitors:

```tsx
// Respect reduced motion preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Add proper ARIA labels
<button aria-label="Close lightbox" onClick={onClose}>×</button>
<button aria-label="Previous image" onClick={goToPrevious}>‹</button>
<button aria-label="Next image" onClick={goToNext}>›</button>

// Focus trap in modal
// Consider using a library like @headlessui/react for this
```

## Conclusion

A well-crafted photo gallery elevates any website. The combination of CSS Grid, smooth animations, and keyboard navigation creates a professional, accessible experience. The modular structure makes it easy to customize for your specific needs.

---

## Related Tutorials

- [Creating Magnetic Button Effects](/blog/magnetic-button-effect)
- [Building Animated Counters](/blog/animated-counters)
- [Dropdown Navigation with Animations](/blog/codrops-dropdown-navigation)
