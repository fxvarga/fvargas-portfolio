# Building an Animated Counter with React

Animated counters are a popular way to display statistics and key metrics. When implemented well, they create an engaging "counting up" effect that draws attention to important numbers.

## What We're Building

Our animated counter includes:

- **Smooth eased animations** using requestAnimationFrame
- **Intersection Observer** for scroll-triggered animations
- **Configurable options** (duration, prefix, suffix, decimals)
- **Number formatting** with locale support

TIP: Scroll down and back up to the demo to see the animation replay!

## Step 1: The Core Counter Hook

Let's start with a custom hook that handles the counting logic:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCounterOptions {
  end: number;
  duration?: number;
  decimals?: number;
}

const useCounter = ({ end, duration = 2000, decimals = 0 }: UseCounterOptions) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Easing function for smooth animation
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  const animate = useCallback(() => {
    const startTime = performance.now();
    
    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      setCount(easedProgress * end);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [end, duration]);

  return { count, elementRef, animate, hasAnimated, setHasAnimated };
};
```

## Step 2: Understanding the Easing Function

The `easeOutQuart` function creates a natural-feeling animation that starts fast and slows down at the end:

```tsx
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};
```

| Progress (t) | Eased Value |
|--------------|-------------|
| 0.0          | 0.00        |
| 0.25         | 0.68        |
| 0.50         | 0.94        |
| 0.75         | 0.996       |
| 1.0          | 1.00        |

NOTE: The "quart" in easeOutQuart refers to the exponent (4). Higher exponents create more dramatic easing. Try `Math.pow(1 - t, 2)` for a gentler curve.

## Step 3: Adding Intersection Observer

We want the animation to start when the counter scrolls into view:

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate();
        }
      });
    },
    { threshold: 0.3 } // Trigger when 30% visible
  );

  if (elementRef.current) {
    observer.observe(elementRef.current);
  }

  return () => observer.disconnect();
}, [animate, hasAnimated]);
```

## Step 4: Formatting the Display

We need to handle different formats: integers, decimals, and large numbers:

```tsx
const formatNumber = (value: number, decimals: number): string => {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }
  return Math.round(value).toLocaleString();
};

// Usage examples:
// formatNumber(1234567, 0)  → "1,234,567"
// formatNumber(98.5, 1)     → "98.5"
// formatNumber(50000, 0)    → "50,000"
```

## Step 5: The Counter Component

Here's the complete Counter component:

```tsx
interface CounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}

const Counter: React.FC<CounterProps> = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  label 
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

  const animate = useCallback(() => {
    const startTime = performance.now();
    
    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(easeOutQuart(progress) * end);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [end, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate();
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [animate, hasAnimated]);

  const displayValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.round(count).toLocaleString();

  return (
    <div className="counter-item" ref={counterRef}>
      <div className="counter-value">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="counter-label">{label}</div>
    </div>
  );
};
```

## Step 6: Styling

```css
.counter-item {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.counter-item:hover {
  transform: translateY(-4px);
}

.counter-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #c26a2d;
  font-family: 'JetBrains Mono', monospace;
}

.counter-label {
  color: #888;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Usage Examples

```tsx
// Basic counter
<Counter end={150} label="Projects" />

// With prefix and suffix
<Counter end={98.5} suffix="%" decimals={1} label="Satisfaction" />

// Large number with formatting
<Counter end={50000} suffix="+" label="Lines of Code" />

// With custom duration
<Counter end={12} suffix="+" duration={3000} label="Years Experience" />
```

## Performance Considerations

WARNING: Avoid running too many counters simultaneously. Each uses its own animation frame loop.

For better performance with many counters:

1. **Batch animations** - Start all counters at the same time
2. **Use a single RAF loop** - Share one `requestAnimationFrame` for all counters
3. **Throttle updates** - Don't update on every frame for very long animations

## Accessibility

For users who prefer reduced motion:

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Show final value immediately
  setCount(end);
} else {
  animate();
}
```

## Conclusion

Animated counters are a small detail that can make statistics feel more dynamic and engaging. The key is smooth easing and appropriate triggers (like scroll position).

---

## Related Tutorials

- [Magnetic Button Effect](/blog/magnetic-button-effect)
- [Typing Effect Animation](/blog/typing-effect-animation)
