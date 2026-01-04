# Building a Typewriter Effect with React

The typewriter effect is a classic animation that simulates text being typed character by character. It's perfect for hero sections, landing pages, and anywhere you want to create visual interest with text.

## What We're Building

Our typewriter implementation includes:

- **Typing and deleting animations** with configurable speeds
- **Multiple phrase cycling** with smooth transitions
- **Blinking cursor** animation
- **Zero external dependencies**

TIP: Try adding your own phrases using the controls in the demo above!

## Step 1: Component State

We need to track several pieces of state:

```tsx
const [displayText, setDisplayText] = useState('');      // Currently visible text
const [phraseIndex, setPhraseIndex] = useState(0);        // Which phrase we're on
const [isDeleting, setIsDeleting] = useState(false);      // Typing or deleting?
const [isPaused, setIsPaused] = useState(false);          // Pause at end of phrase?
```

## Step 2: The Animation Loop

The core logic uses a recursive setTimeout pattern:

```tsx
const tick = useCallback(() => {
  const currentPhrase = phrases[phraseIndex];
  
  if (isPaused) {
    // Wait before starting to delete
    setTimeout(() => {
      setIsPaused(false);
      setIsDeleting(true);
    }, pauseTime);
    return;
  }

  if (isDeleting) {
    // Remove one character
    if (displayText.length > 0) {
      setDisplayText(displayText.slice(0, -1));
      setTimeout(tick, deletingSpeed);
    } else {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }
  } else {
    // Add one character
    if (displayText.length < currentPhrase.length) {
      setDisplayText(currentPhrase.slice(0, displayText.length + 1));
      setTimeout(tick, typingSpeed);
    } else {
      // Finished typing, pause before deleting
      setIsPaused(true);
      setTimeout(tick, 0);
    }
  }
}, [displayText, isDeleting, isPaused, phraseIndex, phrases]);
```

## Step 3: Understanding the State Machine

The animation follows a state machine pattern:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  TYPING ──────► PAUSED ──────► DELETING ──────┐         │
│     ▲                                          │         │
│     │                                          │         │
│     └──────────────────────────────────────────┘         │
│                (cycle to next phrase)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

NOTE: The phrase changes only after deleting is complete, not during the pause. This prevents visual glitches.

## Step 4: The Blinking Cursor

The cursor is pure CSS animation:

```css
.typing-cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

The `step-end` timing function creates a sharp on/off blink rather than a fade.

## Step 5: Complete Component

Here's the full implementation:

```tsx
interface TypingEffectProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseTime = 2000,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const currentPhrase = phrases[phraseIndex];

  const tick = useCallback(() => {
    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return;
    }

    if (isDeleting) {
      if (displayText.length > 0) {
        setDisplayText(displayText.slice(0, -1));
        timeoutRef.current = setTimeout(tick, deletingSpeed);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        timeoutRef.current = setTimeout(tick, typingSpeed);
      } else {
        setIsPaused(true);
        timeoutRef.current = setTimeout(tick, 0);
      }
    }
  }, [displayText, isDeleting, isPaused, currentPhrase, phrases.length, 
      typingSpeed, deletingSpeed, pauseTime]);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, typingSpeed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, typingSpeed]);

  return (
    <span className={`typing-effect ${className}`}>
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
};
```

## Usage Examples

```tsx
// Basic usage
<TypingEffect 
  phrases={['Developer', 'Designer', 'Creator']} 
/>

// With custom speeds
<TypingEffect 
  phrases={['Fast typer', 'Quick thinker']}
  typingSpeed={50}
  deletingSpeed={30}
  pauseTime={1500}
/>

// In a hero section
<h1>
  I am a <TypingEffect phrases={['Full-Stack Developer', 'UI Enthusiast']} />
</h1>
```

## Speed Guidelines

| Speed (ms) | Feel |
|------------|------|
| 30-50      | Fast, energetic |
| 80-120     | Natural, comfortable |
| 150-200    | Slow, deliberate |

WARNING: Typing speeds below 30ms can look unnatural and may cause performance issues on slower devices.

## Common Customizations

### 1. Delete All at Once

Instead of character-by-character deletion:

```tsx
// In the deleting branch:
if (isDeleting) {
  setDisplayText(''); // Clear all at once
  setIsDeleting(false);
  setPhraseIndex((prev) => (prev + 1) % phrases.length);
}
```

### 2. Random Typing Speed

Add variation for a more natural feel:

```tsx
const getRandomSpeed = (base: number) => {
  return base + Math.random() * 50 - 25; // ±25ms variation
};

setTimeout(tick, getRandomSpeed(typingSpeed));
```

### 3. Pause on First Phrase

Don't immediately start deleting the first phrase:

```tsx
const [isFirstRun, setIsFirstRun] = useState(true);

// In the paused logic:
const pauseDuration = isFirstRun ? pauseTime * 2 : pauseTime;
if (isFirstRun) setIsFirstRun(false);
```

## Accessibility

For screen readers and reduced motion preferences:

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Just show the first phrase statically
  return <span className={className}>{phrases[0]}</span>;
}

// Also add aria-label for screen readers
<span 
  className="typing-effect" 
  aria-label={phrases.join(', ')}
>
  {displayText}
  <span className="typing-cursor" aria-hidden="true">|</span>
</span>
```

## Conclusion

The typewriter effect is a timeless animation that adds personality to your text. With React's state management, we can create a flexible, reusable component that handles all the edge cases.

---

## Related Tutorials

- [Dropdown Navigation](/blog/codrops-dropdown-navigation)
- [Magnetic Buttons](/blog/magnetic-button-effect)
- [Animated Counters](/blog/animated-counters)
