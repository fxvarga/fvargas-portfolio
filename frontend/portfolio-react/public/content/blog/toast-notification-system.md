# Building a Toast Notification System with React

Create animated toast notifications with multiple types, positions, and queue management. Perfect for providing user feedback, alerts, and status updates in modern web applications.

## What We're Building

Our toast notification system implementation includes:

- **Multiple notification types** (success, error, warning, info)
- **Configurable positions** and animation styles
- **Auto-dismiss functionality** with progress indicators
- **Queue management** for multiple notifications
- **Accessibility support** with ARIA attributes

TIP: Try the different notification types and positions using the controls above to see how they appear and animate!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useEffect, useCallback)
- Familiarity with CSS animations and transitions

## Step 1: Toast Component Structure

Let's start by creating the individual toast component with animations:

```tsx
import React, { useState, useEffect, useCallback } from 'react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300); // Match CSS transition duration
  }, [id, onClose]);

  return (
    <div
      className={`toast toast-${type} ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Toast content */}
    </div>
  );
};
```

## Step 2: Toast Container with Positioning

Now let's create the container component that manages multiple toasts:

```tsx
interface ToastNotificationSystemProps {
  className?: string;
}

const ToastNotificationSystem: React.FC<ToastNotificationSystemProps> = ({ className }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [position, setPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'>('top-right');
  const [animationType, setAnimationType] = useState<'slide' | 'fade' | 'bounce' | 'scale'>('slide');

  const addToast = useCallback((type: ToastProps['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      onClose: (toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  return (
    <div className={`toast-notification-system-demo ${className || ''}`}>
      {/* Controls */}
      <div className={`toast-container ${position} ${animationType}`}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
};
```

## Step 3: Complete Toast Component with Icons and Progress

Let's add the complete toast component with icons, close button, and progress bar:

```tsx
const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  // ... existing state and effects

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div
      className={`toast toast-${type} ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ✕
      </button>
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};
```

## Step 4: Main Component with Demo Controls

Let's add the complete main component with interactive controls:

```tsx
const ToastNotificationSystem: React.FC<ToastNotificationSystemProps> = ({ className }) => {
  // ... existing state

  const demoNotifications = [
    {
      type: 'success' as const,
      title: 'Success!',
      message: 'Your changes have been saved successfully.'
    },
    // ... more notification types
  ];

  return (
    <div className={`toast-notification-system-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Toast Notification System</h4>
        <p>Animated toast notifications with multiple types and positions</p>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Position:</label>
            <select value={position} onChange={(e) => setPosition(e.target.value as typeof position)}>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-center">Top Center</option>
            </select>
          </div>

          <div className="control-group">
            <label>Animation:</label>
            <select value={animationType} onChange={(e) => setAnimationType(e.target.value as typeof animationType)}>
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="bounce">Bounce</option>
              <option value="scale">Scale</option>
            </select>
          </div>
        </div>

        <div className="control-row">
          <div className="notification-buttons">
            {demoNotifications.map((notification, index) => (
              <button
                key={index}
                className={`notification-btn ${notification.type}`}
                onClick={() => addToast(notification.type, notification.title, notification.message)}
              >
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast container */}
    </div>
  );
};
```

## Styling

The CSS includes multiple animation types and positioning options:

```css
/* Toast Container Positions */
.toast-container {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.toast-container.top-right {
  top: 20px;
  right: 20px;
}

.toast-container.bottom-left {
  bottom: 20px;
  left: 20px;
}

/* Toast Animations */
.toast {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.toast.exiting {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* Animation Types */
.toast-container.slide .toast {
  transform: translateX(100%);
}

.toast-container.slide .toast.visible {
  transform: translateX(0);
}

.toast-container.bounce .toast {
  animation: bounceIn 0.4s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translateY(-50px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Progress Bar */
.toast-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #c26a2d, #a55a25);
  animation: progressShrink linear forwards;
}

@keyframes progressShrink {
  from { width: 100%; }
  to { width: 0%; }
}
```

## Usage Examples

```tsx
// Basic usage
const [toasts, setToasts] = useState([]);

const addToast = (type, title, message) => {
  const id = Date.now().toString();
  setToasts(prev => [...prev, { id, type, title, message }]);
};

// Success notification
addToast('success', 'Saved!', 'Your profile has been updated.');

// Error notification
addToast('error', 'Failed', 'Unable to save changes.');

// In a form submission
const handleSubmit = async (data) => {
  try {
    await saveData(data);
    addToast('success', 'Success', 'Data saved successfully!');
  } catch (error) {
    addToast('error', 'Error', 'Failed to save data.');
  }
};
```

## Performance Considerations

WARNING: Multiple simultaneous toasts can impact performance. Consider limiting the number of visible toasts.

- Limit maximum visible toasts (e.g., 5)
- Use CSS transforms for animations (GPU-accelerated)
- Clean up timers and event listeners
- Consider using a toast library for complex applications

## Accessibility

Our toast system includes comprehensive accessibility features:

```tsx
// ARIA attributes
<div
  className="toast"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <div className="toast-content">
    <div className="toast-title">{title}</div>
    <div className="toast-message">{message}</div>
  </div>
</div>

// Focus management for interactive toasts
<button
  className="toast-action"
  onClick={handleAction}
  autoFocus={isFirstToast}
>
  {actionText}
</button>
```

- **ARIA live regions** for screen reader announcements
- **Role attributes** for proper semantics
- **Keyboard navigation** support
- **Focus management** for interactive elements

## Conclusion

Toast notifications provide immediate, non-intrusive feedback to users about actions and system status. The combination of multiple animation types, positioning options, and accessibility features makes this a robust notification system for any React application.

Experiment with different combinations of positions and animations to find what works best for your user experience!

---

## Related Tutorials

- [Building Animated Modal Dialogs with React](/blog/animated-modal-dialogs)
- [Building Scroll-Triggered Animated Counters](/blog/animated-counters)
- [Creating a Typewriter Effect with React](/blog/typing-effect-animation)