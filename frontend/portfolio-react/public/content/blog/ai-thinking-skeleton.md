# Creating AI Thinking Skeleton Loaders with React

Build elegant shimmer, pulse, and wave skeleton animations for AI loading states. Perfect for displaying placeholder content while waiting for AI model responses, data analysis, or any async operation.

## What We're Building

Our AI thinking skeleton system includes:

- **Three animation variants** — shimmer, pulse, and wave effects
- **Four layout templates** for chat responses, code blocks, cards, and analysis panels
- **Composable primitives** (lines and circles) for custom layouts
- **Configurable animation speed** from slow to fast
- **Zero external dependencies** — pure CSS animations

TIP: Switch between the animation types and layout templates above. Try the "Wave" animation with the "Analysis Panel" layout for a premium loading feel!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of CSS animations (@keyframes, pseudo-elements)
- Familiarity with React component composition

## Step 1: Build Skeleton Primitives

The foundation of our skeleton system is two composable primitives — lines and circles:

```tsx
type SkeletonVariant = 'shimmer' | 'pulse' | 'wave';

interface SkeletonLineProps {
  width?: string;
  height?: string;
  variant: SkeletonVariant;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = '14px',
  variant,
}) => (
  <div
    className={`skeleton-line skeleton-${variant}`}
    style={{ width, height }}
    role="presentation"
    aria-hidden="true"
  />
);

const SkeletonCircle: React.FC<{ size?: string; variant: SkeletonVariant }> = ({
  size = '36px',
  variant,
}) => (
  <div
    className={`skeleton-circle skeleton-${variant}`}
    style={{ width: size, height: size }}
    role="presentation"
    aria-hidden="true"
  />
);
```

NOTE: We use `role="presentation"` and `aria-hidden="true"` because skeleton elements are purely decorative. The parent container should use `role="status"` and `aria-label` to announce loading state.

## Step 2: Create the Shimmer Animation

The shimmer effect uses a CSS pseudo-element with a gradient that slides across the skeleton:

```css
.skeleton-shimmer {
  background: rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.08),
    transparent
  );
  animation: shimmerSlide 1.5s ease-in-out infinite;
}

@keyframes shimmerSlide {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

The gradient creates a "light sweep" effect that's universally recognized as a loading indicator.

## Step 3: Add Pulse and Wave Variants

The pulse variant simply fades in and out, while the wave uses a colored gradient sweep:

```css
/* Pulse — simple opacity animation */
.skeleton-pulse {
  background: rgba(255, 255, 255, 0.06);
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Wave — colored gradient sweep */
.skeleton-wave::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(194, 106, 45, 0.12) 25%,
    rgba(194, 106, 45, 0.2) 50%,
    rgba(194, 106, 45, 0.12) 75%,
    transparent 100%
  );
  animation: waveSlide 1.5s ease-in-out infinite;
}

@keyframes waveSlide {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0%); }
}
```

## Step 4: Compose Layout Templates

Now we compose our primitives into meaningful layout templates. Here's a chat response skeleton:

```tsx
const ChatResponseSkeleton: React.FC<{ variant: SkeletonVariant }> = ({ variant }) => (
  <div className="skeleton-chat-response">
    <SkeletonCircle variant={variant} />
    <div className="skeleton-chat-body">
      <SkeletonLine variant={variant} width="120px" height="12px" />
      <SkeletonLine variant={variant} width="100%" />
      <SkeletonLine variant={variant} width="92%" />
      <SkeletonLine variant={variant} width="78%" />
      <SkeletonLine variant={variant} width="45%" />
    </div>
  </div>
);
```

The varying widths create a natural "paragraph" feel. The last line is always shorter to mimic how real text rarely fills the full width.

## Step 5: Add Speed Controls

Speed control is as simple as CSS custom properties or class-based duration overrides:

```css
.speed-slow .skeleton-shimmer::after { animation-duration: 2.5s; }
.speed-normal .skeleton-shimmer::after { animation-duration: 1.5s; }
.speed-fast .skeleton-shimmer::after { animation-duration: 0.8s; }
```

## Styling

Key styling techniques:

```css
/* Base skeleton — relative positioned for pseudo-element overlay */
.skeleton-line,
.skeleton-circle {
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton-circle {
  border-radius: 50%;
  flex-shrink: 0;
}

/* Code block layout with header bar */
.skeleton-code-block {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-code-header {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
```

## Usage Examples

```tsx
// Simple loading state
{isLoading ? (
  <ChatResponseSkeleton variant="shimmer" />
) : (
  <ChatMessage message={response} />
)}

// Custom skeleton layout
<div className="my-skeleton" role="status" aria-label="Loading results">
  <SkeletonLine variant="shimmer" width="60%" height="20px" />
  <SkeletonLine variant="shimmer" width="100%" />
  <SkeletonLine variant="shimmer" width="85%" />
</div>

// With speed control
<div className="speed-fast">
  <CodeBlockSkeleton variant="wave" />
</div>
```

## Performance Considerations

WARNING: Avoid rendering hundreds of skeleton elements simultaneously. Each shimmer pseudo-element runs its own GPU-composited animation, which can impact performance on lower-end devices.

- Use `will-change: transform` sparingly — browsers handle `::after` animations efficiently already
- Prefer `transform` and `opacity` animations (GPU-accelerated) over `left` positioning
- Limit the number of visible skeleton instances (3-5 is ideal)
- Consider using a single shimmer overlay on a container instead of per-element animations for very complex layouts

## Accessibility

```tsx
// Parent container announces loading
<div role="status" aria-label="Loading AI response">
  <ChatResponseSkeleton variant="shimmer" />
</div>

// Individual skeleton elements are hidden from AT
<div role="presentation" aria-hidden="true" className="skeleton-line" />
```

- **`role="status"`** on the container announces loading to screen readers
- **`aria-hidden="true"`** hides decorative skeleton elements
- **Reduced motion** support disables all animations and shows static placeholders

## Conclusion

Skeleton loaders provide crucial visual feedback during AI processing. The composable primitive approach lets you build any layout from simple lines and circles, while the three animation variants let you match your application's design language. Use shimmer for a modern feel, pulse for subtlety, or wave for brand-colored loading states.

---

## Related Tutorials

- [Building an AI Chat Bubble Component](/blog/ai-chat-bubble)
- [Building AI Tool Call Cards with React](/blog/ai-tool-call-card)
- [Creating a Toast Notification System](/blog/toast-notification-system)
