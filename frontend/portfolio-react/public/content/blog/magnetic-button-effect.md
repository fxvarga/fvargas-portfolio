# Creating Magnetic Buttons with React

Magnetic buttons are a delightful UI interaction where buttons subtly follow the cursor as it hovers over them, creating a sense of physical attraction. This effect is popular in premium websites and adds a layer of polish to your interface.

## What We're Building

Our magnetic button implementation includes:

- **Smooth cursor-following effect** based on mouse position
- **Configurable magnetic strength** for different use cases
- **Inner content parallax** for added depth
- **Multiple button variants** (primary, secondary, outline, icon-only)

TIP: Adjust the "Magnetic Strength" slider in the demo above to see how different values affect the interaction!

## The Core Concept

The magnetic effect works by:

1. Tracking the mouse position relative to the button's center
2. Calculating a delta (distance from center)
3. Applying a transform based on that delta
4. Smoothly transitioning back when the mouse leaves

## Step 1: Basic Component Structure

```tsx
import React, { useRef, useState } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  children, 
  strength = 0.35,
  className = '',
  onClick 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // ... event handlers

  return (
    <button
      ref={buttonRef}
      className={`magnetic-button ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## Step 2: Tracking Mouse Movement

The key to the effect is calculating how far the cursor is from the button's center:

```tsx
const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
  if (!buttonRef.current) return;

  const rect = buttonRef.current.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Calculate distance from center, multiplied by strength
  const deltaX = (e.clientX - centerX) * strength;
  const deltaY = (e.clientY - centerY) * strength;

  setPosition({ x: deltaX, y: deltaY });
};
```

## Step 3: Resetting on Mouse Leave

When the cursor leaves, we smoothly return to the original position:

```tsx
const handleMouseLeave = () => {
  setPosition({ x: 0, y: 0 });
  setIsHovered(false);
};
```

The smooth transition is handled by CSS:

```css
.magnetic-button {
  transition: transform 0.15s ease-out;
}
```

NOTE: We use a fast transition (0.15s) so the button feels responsive. The `ease-out` timing function makes it snap back quickly then slow down.

## Step 4: Adding Depth with Parallax

To create a sense of depth, we move the inner content at a different rate than the button itself:

```tsx
<button style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
  <span 
    className="button-content"
    style={{
      // Inner content moves at 30% of the button's movement
      transform: `translate(${position.x * 0.3}px, ${position.y * 0.3}px)`,
    }}
  >
    {children}
  </span>
</button>
```

This creates a subtle 3D effect where the content appears to float above the button surface.

## Step 5: Styling Variants

Here's how to create different button styles:

```css
/* Primary (default) */
.magnetic-button {
  background: linear-gradient(135deg, #c26a2d 0%, #a85a25 100%);
  color: #fff;
  border-radius: 50px;
  padding: 1rem 2rem;
}

/* Secondary */
.magnetic-button.secondary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Outline */
.magnetic-button.outline {
  background: transparent;
  border: 2px solid rgba(194, 106, 45, 0.6);
}

/* Icon only (circular) */
.magnetic-button.icon-only {
  width: 60px;
  height: 60px;
  padding: 0;
  border-radius: 50%;
}
```

## Performance Tips

WARNING: Be careful with the `strength` value. Values above 0.5 can make the button feel jittery or hard to click.

For best performance:

1. Use `transform` instead of `left/top` positioning
2. Add `will-change: transform` to hint at the animation
3. Consider using `requestAnimationFrame` for very frequent updates

```css
.magnetic-button {
  will-change: transform;
}
```

## Accessibility Considerations

Magnetic effects can be problematic for users with motor impairments. Consider:

1. **Respecting reduced motion preferences**:

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Disable effect if user prefers reduced motion
const effectiveStrength = prefersReducedMotion ? 0 : strength;
```

2. **Keeping the click target stable** - The magnetic pull should be subtle enough that users can still click accurately

## Complete Implementation

Here's the full component with all features:

```tsx
const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  children, 
  strength = 0.35,
  className = '',
  onClick 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <button
      ref={buttonRef}
      className={`magnetic-button ${className} ${isHovered ? 'is-hovered' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
    >
      <span 
        className="magnetic-button-content"
        style={{ transform: `translate(${position.x * 0.3}px, ${position.y * 0.3}px)` }}
      >
        {children}
      </span>
    </button>
  );
};
```

## Conclusion

Magnetic buttons add a premium feel to your UI with just a few lines of code. The key is keeping the effect subtle - it should enhance the experience without getting in the way.

---

## Related Tutorials

- [Building Dropdown Navigation](/blog/codrops-dropdown-navigation)
- [Creating Typing Effects](/blog/typing-effect-animation)
