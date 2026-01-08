# Building Progress Bars with CSS Animations

Create engaging progress bars with multiple animation styles, loading states, and customizable designs. Perfect for file uploads, data processing, and task completion indicators.

## What We're Building

Our progress bars implementation includes:

- **Multiple progress bar types** (linear, circular, wave, dots)
- **Smooth CSS animations** with keyframes and transitions
- **Configurable sizes and colors** for different contexts
- **Auto-progress mode** for demonstrations
- **Responsive design** that works on all devices

TIP: Try the different types and enable auto-progress to see the animations in action!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useEffect)
- Familiarity with CSS animations and SVG

## Step 1: Progress Bar Component Structure

Let's start by creating the basic progress bar component with different types:

```tsx
import React from 'react';
import './ProgressBarsCssAnimations.css';

interface ProgressBarProps {
  progress: number;
  type: 'linear' | 'circular' | 'wave' | 'dots';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animated?: boolean;
  showPercentage?: boolean;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  type,
  size = 'medium',
  color = '#c26a2d',
  animated = true,
  showPercentage = true,
  label
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Component implementation will vary by type
  return (
    <div className={`progress-bar-container ${type} ${size}`}>
      {label && <div className="progress-label">{label}</div>}
      {/* Progress bar content based on type */}
    </div>
  );
};
```

## Step 2: Linear Progress Bar Implementation

Let's implement the linear progress bar with smooth animations:

```tsx
// Linear progress bar (default)
return (
  <div className={`progress-bar-container linear ${size}`}>
    {label && <div className="progress-label">{label}</div>}
    <div className="linear-progress">
      <div
        className={`linear-fill ${animated ? 'animated' : ''}`}
        style={{
          width: `${clampedProgress}%`,
          background: color
        }}
      />
    </div>
    {showPercentage && (
      <div className="linear-percentage">{Math.round(clampedProgress)}%</div>
    )}
  </div>
);
```

## Step 3: Circular Progress Bar with SVG

Now let's add the circular progress bar using SVG paths:

```tsx
if (type === 'circular') {
  const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`progress-bar-container circular ${size}`}>
      {label && <div className="progress-label">{label}</div>}
      <div className="circular-progress">
        <svg width={radius * 2 + 10} height={radius * 2 + 10}>
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={animated ? 'animated' : ''}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center'
            }}
          />
        </svg>
        {showPercentage && (
          <div className="circular-percentage">
            {Math.round(clampedProgress)}%
          </div>
        )}
      </div>
    </div>
  );
}
```

NOTE: The circular progress uses SVG stroke properties to create the animated ring effect. The strokeDashoffset is calculated based on the progress percentage.

## Step 4: Wave and Dots Progress Bars

Let's add the wave and dots progress bar variants:

```tsx
if (type === 'wave') {
  return (
    <div className={`progress-bar-container wave ${size}`}>
      {label && <div className="progress-label">{label}</div>}
      <div className="wave-progress">
        <div
          className="wave-fill"
          style={{
            width: `${clampedProgress}%`,
            background: color,
            animation: animated ? 'wave 2s ease-in-out infinite' : 'none'
          }}
        />
        <div className="wave-overlay" />
      </div>
      {showPercentage && (
        <div className="wave-percentage">{Math.round(clampedProgress)}%</div>
      )}
    </div>
  );
}

if (type === 'dots') {
  return (
    <div className={`progress-bar-container dots ${size}`}>
      {label && <div className="progress-label">{label}</div>}
      <div className="dots-progress">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`dot ${i < clampedProgress / 10 ? 'active' : ''} ${animated ? 'animated' : ''}`}
            style={{
              background: color,
              animationDelay: animated ? `${i * 0.1}s` : '0s'
            }}
          />
        ))}
      </div>
      {showPercentage && (
        <div className="dots-percentage">{Math.round(clampedProgress)}%</div>
      )}
    </div>
  );
}
```

## Step 5: Main Demo Component with Controls

Now let's create the main component with interactive controls:

```tsx
const ProgressBarsCssAnimations: React.FC<ProgressBarsCssAnimationsProps> = ({ className }) => {
  const [progress, setProgress] = useState(65);
  const [type, setType] = useState<'linear' | 'circular' | 'wave' | 'dots'>('linear');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [color, setColor] = useState('#c26a2d');
  const [animated, setAnimated] = useState(true);
  const [autoProgress, setAutoProgress] = useState(false);

  useEffect(() => {
    if (autoProgress) {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 1));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [autoProgress]);

  return (
    <div className={`progress-bars-css-animations-demo ${className || ''}`}>
      {/* Controls */}
      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Type:</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="linear">Linear</option>
              <option value="circular">Circular</option>
              <option value="wave">Wave</option>
              <option value="dots">Dots</option>
            </select>
          </div>
          {/* More controls */}
        </div>
      </div>

      {/* Progress showcase */}
      <div className="progress-showcase">
        <div className="main-progress">
          <ProgressBar
            progress={progress}
            type={type}
            size={size}
            color={color}
            animated={animated}
            label="Main Progress"
          />
        </div>
      </div>
    </div>
  );
};
```

## Styling

The CSS includes keyframe animations for each progress bar type:

```css
/* Linear progress with shimmer effect */
.linear-fill.animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: linearShimmer 2s ease-in-out infinite;
}

@keyframes linearShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Wave animation */
@keyframes waveFlow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Dots pulse animation */
@keyframes dotPulse {
  0%, 100% { transform: scale(1.2); }
  50% { transform: scale(1.4); }
}
```

## Usage Examples

```tsx
// Basic linear progress bar
<ProgressBar progress={75} type="linear" />

// Circular progress with custom color
<ProgressBar
  progress={progress}
  type="circular"
  color="#4ade80"
  size="large"
  label="Upload Progress"
/>

// Auto-animating wave progress
<ProgressBar
  progress={progress}
  type="wave"
  animated={true}
  showPercentage={false}
/>

// Dots progress for step indicators
<ProgressBar
  progress={40}
  type="dots"
  size="small"
  label="Step 4 of 10"
/>
```

## Performance Considerations

WARNING: CSS animations can impact performance. Use GPU-accelerated properties and test on target devices.

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Limit the number of simultaneously animating elements
- Consider using `will-change` for better performance
- Debounce progress updates for smooth animations

## Accessibility

Our progress bars include accessibility features:

```tsx
// ARIA attributes for screen readers
<div
  className="linear-progress"
  role="progressbar"
  aria-valuenow={clampedProgress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={label || "Progress"}
>
  <div
    className="linear-fill"
    style={{ width: `${clampedProgress}%` }}
  />
</div>
```

- **ARIA progressbar** role with value attributes
- **Screen reader** announcements for progress changes
- **Keyboard navigation** support where applicable
- **High contrast** support for visibility

## Conclusion

Progress bars with CSS animations provide visual feedback for long-running operations and enhance user experience. The variety of styles and smooth animations make them versatile for different contexts and design requirements.

Experiment with different combinations of types, colors, and sizes to find what works best for your application!

---

## Related Tutorials

- [Building Scroll-Triggered Animated Counters](/blog/animated-counters)
- [Creating a Typewriter Effect with React](/blog/typing-effect-animation)
- [Building Parallax Scrolling Cards with React](/blog/parallax-scrolling-cards)