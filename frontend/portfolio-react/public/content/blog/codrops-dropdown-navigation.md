# Building a Codrops-Style Dropdown Navigation with React

In this tutorial, we'll create an elegant dropdown navigation menu inspired by the creative interfaces often showcased on Codrops. The navigation features a sliding indicator, smooth hover animations, and staggered dropdown reveals.

## What We're Building

The navigation includes several key features:

- **Sliding indicator** that follows the active/hovered menu item
- **Animated dropdowns** with staggered item reveals
- **Smooth transitions** for all interactions
- **Keyboard accessible** navigation

TIP: The demo above is fully interactive. Try hovering over the menu items to see the animations in action!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of CSS transitions and transforms
- Familiarity with React hooks (useState, useEffect, useRef)

## Step 1: Setting Up the Component Structure

First, let's define our navigation data structure and create the base component:

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './DropdownNavigation.css';

interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    id: 'products',
    label: 'Products',
    href: '/products',
    children: [
      { id: 'analytics', label: 'Analytics', href: '/products/analytics' },
      { id: 'automation', label: 'Automation', href: '/products/automation' },
      { id: 'integrations', label: 'Integrations', href: '/products/integrations' },
    ],
  },
  // ... more items
];
```

## Step 2: Creating the Sliding Indicator

The sliding indicator is the key visual element. It follows the currently hovered item smoothly:

```tsx
const [indicatorStyle, setIndicatorStyle] = useState({
  left: 0,
  width: 0,
  opacity: 0,
});

const updateIndicator = (element: HTMLElement | null) => {
  if (!element || !navRef.current) return;
  
  const navRect = navRef.current.getBoundingClientRect();
  const itemRect = element.getBoundingClientRect();
  
  setIndicatorStyle({
    left: itemRect.left - navRect.left,
    width: itemRect.width,
    opacity: 1,
  });
};
```

NOTE: The indicator position is calculated relative to the navigation container, not the viewport. This ensures it works correctly even when the navigation is not at the top of the page.

## Step 3: Handling Dropdown Animations

For the dropdown, we use CSS transforms and staggered delays:

```css
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
```

Each dropdown item gets a staggered delay for a cascading reveal effect:

```css
.dropdown-item {
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.25s ease;
}

.nav-item:hover .dropdown-item:nth-child(1) { transition-delay: 0.05s; }
.nav-item:hover .dropdown-item:nth-child(2) { transition-delay: 0.1s; }
.nav-item:hover .dropdown-item:nth-child(3) { transition-delay: 0.15s; }
/* ... and so on */
```

## Step 4: Adding the Chevron Animation

The dropdown indicator (chevron) rotates when the dropdown is open:

```tsx
<span className={`nav-chevron ${activeDropdown === item.id ? 'is-open' : ''}`}>
  <svg width="10" height="10" viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6" />
  </svg>
</span>
```

```css
.nav-chevron {
  transition: transform 0.3s ease;
}

.nav-chevron.is-open {
  transform: rotate(180deg);
}
```

## Step 5: Putting It All Together

Here's the complete component with all the pieces:

```tsx
const DropdownNavigation: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (itemId: string, element: HTMLElement) => {
    setActiveDropdown(itemId);
    updateIndicator(element);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
    setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <nav ref={navRef} className="dropdown-nav" onMouseLeave={handleMouseLeave}>
      <div 
        className="nav-indicator" 
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity,
        }}
      />
      
      <ul className="nav-list">
        {navigationItems.map(item => (
          <li
            key={item.id}
            className={`nav-item ${activeDropdown === item.id ? 'is-active' : ''}`}
            onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
          >
            <a href={item.href} className="nav-link">
              {item.label}
              {item.children && <ChevronIcon />}
            </a>
            
            {item.children && (
              <div className="dropdown-menu">
                {item.children.map(child => (
                  <a key={child.id} href={child.href} className="dropdown-item">
                    {child.label}
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
```

## Performance Considerations

WARNING: Avoid using JavaScript to animate properties that trigger layout recalculations (like `width`, `height`, `top`, `left`). Instead, use `transform` and `opacity` which are GPU-accelerated.

For the indicator, we're using `left` and `width`, but since these only change on hover (not during animations), the performance impact is minimal. For production, you might consider using `transform: translateX()` and `scaleX()` instead.

## Accessibility

To make this navigation accessible:

1. **Add keyboard navigation** - Handle `Tab`, `Enter`, and arrow keys
2. **Use ARIA attributes** - Add `aria-expanded`, `aria-haspopup`, etc.
3. **Ensure focus visibility** - Style the `:focus-visible` state

```tsx
<button
  aria-expanded={activeDropdown === item.id}
  aria-haspopup={item.children ? 'true' : undefined}
>
  {item.label}
</button>
```

## Conclusion

You've now built a sophisticated dropdown navigation with:

- Smooth sliding indicator
- Staggered dropdown animations
- Clean, maintainable code structure

Feel free to customize the timing functions, colors, and animations to match your design system!

---

## Related Tutorials

- [Creating Magnetic Buttons](/blog/magnetic-button-effect)
- [Building a Typing Effect](/blog/typing-effect-animation)
- [Animated Counters](/blog/animated-counters)
