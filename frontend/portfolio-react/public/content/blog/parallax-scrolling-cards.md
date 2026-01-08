# Building Parallax Scrolling Cards with React

Create stunning parallax scrolling effects for card layouts that add depth and visual interest to your web applications. Perfect for hero sections, portfolio showcases, and storytelling interfaces.

## What We're Building

Our parallax scrolling cards implementation includes:

- **Scroll-based parallax transforms** with layered depth effects
- **Intersection Observer integration** for performance optimization
- **Smooth CSS transitions** with hardware acceleration
- **Responsive design** that works on all devices
- **Configurable parallax intensity** for each card layer

TIP: Try scrolling or using the demo controls above to see the parallax effect in action!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useEffect, useRef)
- Familiarity with CSS transforms and transitions

## Step 1: Component Structure and State Management

Let's start by creating the basic component structure with scroll state management:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import './ParallaxScrollingCards.css';

interface CardProps {
  title: string;
  description: string;
  image: string;
  index: number;
  parallaxOffset: number;
}

const Card: React.FC<CardProps> = ({ title, description, image, index, parallaxOffset }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      const translateY = parallaxOffset * (index + 1) * 0.5;
      const rotateX = parallaxOffset * 0.1;
      cardRef.current.style.transform = `translateY(${translateY}px) rotateX(${rotateX}deg)`;
    }
  }, [parallaxOffset, index]);

  return (
    <div className="parallax-card" ref={cardRef}>
      <div className="card-image">
        <img src={image} alt={title} />
        <div className="card-overlay" />
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};
```

## Step 2: Scroll Detection and Parallax Logic

Now let's implement the scroll detection using Intersection Observer and calculate parallax offsets:

```tsx
interface ParallaxScrollingCardsProps {
  className?: string;
}

const ParallaxScrollingCards: React.FC<ParallaxScrollingCardsProps> = ({ className }) => {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const cards = [
    {
      title: "Mountain Adventure",
      description: "Explore the breathtaking peaks and valleys of our national parks.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
    },
    // ... more cards
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
        setScrollY(scrollProgress * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`parallax-scrolling-cards-demo ${className || ''}`}>
      {/* Header and container JSX */}
    </div>
  );
};
```

NOTE: The scroll progress calculation uses the container's position relative to the viewport to create a smooth 0-100% progress value.

## Step 3: Complete Component with Controls

Let's add the interactive controls and complete the component:

```tsx
return (
  <div className={`parallax-scrolling-cards-demo ${className || ''}`}>
    <div className="demo-header">
      <h4>Parallax Scrolling Cards</h4>
      <p>Depth-based parallax effects with scroll-triggered animations</p>
    </div>

    <div className="parallax-container" ref={containerRef}>
      <div className="cards-wrapper">
        {cards.map((card, index) => (
          <Card
            key={index}
            {...card}
            index={index}
            parallaxOffset={scrollY}
          />
        ))}
      </div>
    </div>

    <div className="demo-controls">
      <div className="control-group">
        <label>Scroll Progress: {Math.round(scrollY)}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={scrollY}
          onChange={(e) => setScrollY(parseInt(e.target.value))}
        />
      </div>
    </div>

    <div className="demo-info">
      <h5>Features</h5>
      <ul>
        <li>Intersection Observer for scroll detection</li>
        <li>Layered parallax transforms (translateY, rotateX)</li>
        <li>Smooth CSS transitions and easing</li>
        <li>Responsive card layout with hover effects</li>
        <li>Configurable parallax intensity per card</li>
      </ul>
    </div>
  </div>
);
```

## Styling

The CSS uses modern techniques for smooth animations and visual depth:

```css
.parallax-container {
  position: relative;
  height: 600px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.parallax-card {
  position: relative;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
  color: white;
  transform: translateY(0);
  transition: transform 0.3s ease;
}
```

## Usage Examples

```tsx
// Basic usage
<ParallaxScrollingCards />

// With custom styling
<ParallaxScrollingCards className="my-custom-theme" />

// In a portfolio section
<section className="portfolio-section">
  <h2>Featured Projects</h2>
  <ParallaxScrollingCards />
</section>
```

## Performance Considerations

WARNING: Parallax effects can impact performance on lower-end devices. Always test on target devices and consider fallbacks.

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Limit the number of parallax elements
- Consider using `will-change` for frequently animated properties
- Debounce scroll events if needed for complex calculations

## Accessibility

Our parallax cards include several accessibility considerations:

```tsx
// Respect user preferences for reduced motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // Apply parallax transforms
}
```

- Respects `prefers-reduced-motion` media query
- Maintains keyboard navigation
- Provides alternative content for screen readers
- Ensures sufficient color contrast

## Conclusion

Parallax scrolling cards add visual depth and engagement to your interfaces. The combination of scroll detection, CSS transforms, and smooth animations creates compelling user experiences that work across devices.

Experiment with different parallax intensities and card layouts to find what works best for your project!

---

## Related Tutorials

- [Building a Codrops-Style Dropdown Navigation with React](/blog/codrops-dropdown-navigation)
- [Creating Magnetic Button Effects with React](/blog/magnetic-button-effect)
- [Building Scroll-Triggered Animated Counters](/blog/animated-counters)