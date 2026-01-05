/**
 * Lightroom-Style Photo Gallery Demo Component
 * 
 * A responsive photo gallery with modal preview, keyboard navigation,
 * and smooth animations inspired by Adobe Lightroom.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PhotoGallery.css';

// Sample images using Unsplash
const sampleImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1280&fit=crop',
    alt: 'Mountain landscape at sunset',
    title: 'Alpine Glow',
    metadata: { camera: 'Sony A7III', aperture: 'f/8', shutter: '1/250s', iso: 'ISO 100' }
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1280&fit=crop',
    alt: 'Misty forest in morning light',
    title: 'Forest Mist',
    metadata: { camera: 'Canon EOS R5', aperture: 'f/4', shutter: '1/125s', iso: 'ISO 400' }
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1280&fit=crop',
    alt: 'Sunlight through forest canopy',
    title: 'Light Rays',
    metadata: { camera: 'Nikon Z7', aperture: 'f/11', shutter: '1/60s', iso: 'ISO 200' }
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&h=1280&fit=crop',
    alt: 'Valley with wildflowers',
    title: 'Wildflower Valley',
    metadata: { camera: 'Fujifilm X-T4', aperture: 'f/5.6', shutter: '1/500s', iso: 'ISO 160' }
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1280&fit=crop',
    alt: 'Foggy mountain peaks',
    title: 'Cloud Peaks',
    metadata: { camera: 'Sony A7RIV', aperture: 'f/8', shutter: '1/320s', iso: 'ISO 100' }
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1920&h=1280&fit=crop',
    alt: 'Calm lake reflection',
    title: 'Mirror Lake',
    metadata: { camera: 'Canon EOS R6', aperture: 'f/16', shutter: '2s', iso: 'ISO 50' }
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&h=1280&fit=crop',
    alt: 'Path through autumn forest',
    title: 'Autumn Path',
    metadata: { camera: 'Nikon D850', aperture: 'f/4', shutter: '1/80s', iso: 'ISO 800' }
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop',
    fullSrc: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&h=1280&fit=crop',
    alt: 'Mountain lake at dawn',
    title: 'Dawn Reflection',
    metadata: { camera: 'Sony A1', aperture: 'f/11', shutter: '1/15s', iso: 'ISO 100' }
  },
];

interface ImageData {
  id: number;
  src: string;
  fullSrc: string;
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
  showMetadata?: boolean;
  onImageClick?: (image: ImageData, index: number) => void;
}

// Main Gallery Grid Component
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
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`gallery-item ${loadedImages.has(image.id) ? 'loaded' : ''} ${hoveredId === image.id ? 'hovered' : ''}`}
          onClick={() => onImageClick?.(image, index)}
          onMouseEnter={() => setHoveredId(image.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="gallery-item-inner">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onLoad={() => handleImageLoad(image.id)}
            />
            <div className="gallery-item-overlay">
              <span className="gallery-item-title">{image.title}</span>
              <span className="gallery-item-expand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Modal/Lightbox Component
interface LightboxProps {
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  showMetadata?: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

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

  // Keyboard navigation
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

  // Lock body scroll when open
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

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div 
      className={`lightbox-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      {/* Navigation arrows */}
      <button 
        className={`lightbox-nav prev ${currentIndex === 0 ? 'disabled' : ''}`}
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        aria-label="Previous image"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <button 
        className={`lightbox-nav next ${currentIndex === images.length - 1 ? 'disabled' : ''}`}
        onClick={goToNext}
        disabled={currentIndex === images.length - 1}
        aria-label="Next image"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Main image container */}
      <div 
        className={`lightbox-content ${isZoomed ? 'zoomed' : ''}`}
        onClick={() => setIsZoomed(z => !z)}
        onMouseMove={handleZoomMove}
      >
        {isLoading && (
          <div className="lightbox-loader">
            <div className="loader-spinner" />
          </div>
        )}
        <img
          ref={imageRef}
          src={currentImage.fullSrc}
          alt={currentImage.alt}
          className={isLoading ? 'loading' : ''}
          onLoad={() => setIsLoading(false)}
          style={isZoomed ? {
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          } : undefined}
        />
      </div>

      {/* Bottom bar with metadata and navigation dots */}
      <div className="lightbox-footer">
        {showMetadata && (
          <div className="lightbox-metadata">
            <span className="metadata-title">{currentImage.title}</span>
            <div className="metadata-details">
              <span>{currentImage.metadata.camera}</span>
              <span className="separator">|</span>
              <span>{currentImage.metadata.aperture}</span>
              <span className="separator">|</span>
              <span>{currentImage.metadata.shutter}</span>
              <span className="separator">|</span>
              <span>{currentImage.metadata.iso}</span>
            </div>
          </div>
        )}
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="lightbox-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsLoading(true);
                setIsZoomed(false);
                onNavigate(index);
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="lightbox-hints">
        <span><kbd>←</kbd> <kbd>→</kbd> Navigate</span>
        <span><kbd>Space</kbd> Zoom</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  );
};

// Demo wrapper component
interface DemoProps {
  className?: string;
}

const PhotoGalleryDemo: React.FC<DemoProps> = ({ className }) => {
  const [columns, setColumns] = useState(4);
  const [gap, setGap] = useState(8);
  const [showMetadata, setShowMetadata] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (_image: ImageData, index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className={`photo-gallery-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Lightroom-Style Photo Gallery</h4>
        <p>Click any image to open the lightbox. Use arrow keys to navigate.</p>
      </div>

      <PhotoGalleryGrid
        images={sampleImages}
        columns={columns}
        gap={gap}
        onImageClick={handleImageClick}
      />

      <Lightbox
        images={sampleImages}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        showMetadata={showMetadata}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentImageIndex}
      />

      <div className="demo-controls">
        <div className="control-group">
          <label>Columns: {columns}</label>
          <input
            type="range"
            min="2"
            max="6"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Gap: {gap}px</label>
          <input
            type="range"
            min="0"
            max="24"
            step="4"
            value={gap}
            onChange={(e) => setGap(parseInt(e.target.value))}
          />
        </div>
        <div className="control-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={showMetadata}
              onChange={(e) => setShowMetadata(e.target.checked)}
            />
            Show Metadata
          </label>
        </div>
      </div>

      <div className="demo-info">
        <h5>How It Works</h5>
        <ul>
          <li>CSS Grid for responsive thumbnail layout</li>
          <li>Lazy loading for optimized performance</li>
          <li>Keyboard navigation (← → Esc Space)</li>
          <li>Click-to-zoom with pan functionality</li>
          <li>Smooth CSS transitions and transforms</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoGalleryDemo;
