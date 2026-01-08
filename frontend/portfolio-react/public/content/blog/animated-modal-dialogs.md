# Building Animated Modal Dialogs with React

Create smooth, accessible modal dialogs with multiple animation types, backdrop blur effects, and responsive design. Perfect for confirmations, alerts, and user interactions.

## What We're Building

Our animated modal dialogs implementation includes:

- **Multiple animation types** (scale, slide, fade, bounce)
- **Backdrop blur and click-to-close** functionality
- **Responsive design** with configurable sizes
- **Keyboard navigation** and accessibility features
- **Smooth CSS transitions** with easing functions

TIP: Try the different animation types and sizes using the controls above to see how they affect the modal behavior!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState)
- Familiarity with CSS animations and transitions

## Step 1: Modal Component Structure

Let's start by creating the basic modal component with props for customization:

```tsx
import React from 'react';
import './AnimatedModalDialogs.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  animationType: 'scale' | 'slide' | 'fade' | 'bounce';
  size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  animationType,
  size = 'medium'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content ${animationType} ${size}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Confirm</button>
        </div>
      </div>
    </div>
  );
};
```

## Step 2: Main Demo Component with State Management

Now let's create the main component that manages multiple modals and provides controls:

```tsx
interface AnimatedModalDialogsProps {
  className?: string;
}

const AnimatedModalDialogs: React.FC<AnimatedModalDialogsProps> = ({ className }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState<'scale' | 'slide' | 'fade' | 'bounce'>('scale');
  const [modalSize, setModalSize] = useState<'small' | 'medium' | 'large'>('medium');

  const modals = [
    {
      id: 'welcome',
      title: 'Welcome to Our Platform',
      content: 'Get started with our amazing features and discover what makes our platform special.',
      triggerText: 'Welcome Modal'
    },
    // ... more modal configurations
  ];

  return (
    <div className={`animated-modal-dialogs-demo ${className || ''}`}>
      {/* Header */}
      <div className="demo-header">
        <h4>Animated Modal Dialogs</h4>
        <p>Smooth modal animations with multiple transition types</p>
      </div>

      {/* Controls */}
      <div className="demo-controls">
        <div className="control-group">
          <label>Animation Type:</label>
          <select
            value={animationType}
            onChange={(e) => setAnimationType(e.target.value as typeof animationType)}
          >
            <option value="scale">Scale</option>
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
        {/* Size control */}
      </div>

      {/* Modal triggers */}
      <div className="modal-triggers">
        {modals.map((modal) => (
          <button
            key={modal.id}
            className="modal-trigger"
            onClick={() => setActiveModal(modal.id)}
          >
            {modal.triggerText}
          </button>
        ))}
      </div>

      {/* Render modals */}
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          isOpen={activeModal === modal.id}
          onClose={() => setActiveModal(null)}
          title={modal.title}
          animationType={animationType}
          size={modalSize}
        >
          <p>{modal.content}</p>
        </Modal>
      ))}
    </div>
  );
};
```

## Step 3: Complete Implementation with Features

Let's add the complete implementation with all modal types and features:

```tsx
// Add success and error modals to the modals array
const modals = [
  // ... existing modals
  {
    id: 'success',
    title: 'Success!',
    content: 'Your action has been completed successfully.',
    triggerText: 'Success Modal'
  },
  {
    id: 'error',
    title: 'Something Went Wrong',
    content: 'We encountered an error while processing your request.',
    triggerText: 'Error Modal'
  }
];

// In the modal rendering, add conditional icons
{modals.map((modal) => (
  <Modal
    key={modal.id}
    isOpen={activeModal === modal.id}
    onClose={() => setActiveModal(null)}
    title={modal.title}
    animationType={animationType}
    size={modalSize}
  >
    <p>{modal.content}</p>
    {modal.id === 'success' && (
      <div className="success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
      </div>
    )}
    {modal.id === 'error' && (
      <div className="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
    )}
  </Modal>
))}
```

## Styling

The CSS includes multiple animation keyframes and responsive design:

```css
/* Backdrop with blur effect */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: backdropFadeIn 0.3s ease-out;
}

/* Scale animation */
.modal-content.scale {
  animation-name: modalScaleIn;
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Bounce animation */
.modal-content.bounce {
  animation-name: modalBounceIn;
}

@keyframes modalBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(50px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(-10px);
  }
  70% {
    transform: scale(0.9) translateY(5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

## Usage Examples

```tsx
// Basic modal usage
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  animationType="scale"
>
  <p>Are you sure you want to proceed?</p>
</Modal>

// With custom actions
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Item"
  animationType="slide"
  size="small"
>
  <p>This action cannot be undone.</p>
  <div className="modal-footer">
    <button onClick={() => setIsOpen(false)}>Cancel</button>
    <button onClick={handleDelete}>Delete</button>
  </div>
</Modal>
```

## Performance Considerations

WARNING: Modal animations can cause layout shifts. Always test on target devices and consider using transform-based animations.

- Use `transform` and `opacity` for GPU acceleration
- Avoid animating layout properties like `width` and `height`
- Consider using `will-change` for better performance
- Test animations on lower-end devices

## Accessibility

Our modal implementation includes comprehensive accessibility features:

```tsx
// Focus management
useEffect(() => {
  if (isOpen) {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }
}, [isOpen]);
```

- **Keyboard navigation** with Tab and Shift+Tab
- **Focus trapping** within the modal
- **ARIA labels** and roles
- **ESC key** to close
- **Screen reader** support

## Conclusion

Animated modal dialogs enhance user experience by providing smooth, engaging transitions for important interactions. The combination of multiple animation types, accessibility features, and responsive design makes this a versatile component for any React application.

Experiment with different animation combinations and customize the styling to match your design system!

---

## Related Tutorials

- [Building a Codrops-Style Dropdown Navigation with React](/blog/codrops-dropdown-navigation)
- [Creating Magnetic Button Effects with React](/blog/magnetic-button-effect)
- [Building Parallax Scrolling Cards with React](/blog/parallax-scrolling-cards)