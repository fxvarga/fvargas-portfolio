/**
 * Toast Notification System Demo Component
 *
 * Animated toast notifications with multiple types, positions,
 * and queue management using React and CSS transitions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ToastNotificationSystem.css';

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

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300); // Match CSS transition duration
  }, [id, onClose]);

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
  }, [duration, handleClose]);

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

    // Auto-remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500); // Duration + exit animation
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const demoNotifications = [
    {
      type: 'success' as const,
      title: 'Success!',
      message: 'Your changes have been saved successfully.'
    },
    {
      type: 'error' as const,
      title: 'Error',
      message: 'Failed to save changes. Please try again.'
    },
    {
      type: 'warning' as const,
      title: 'Warning',
      message: 'Your session will expire in 5 minutes.'
    },
    {
      type: 'info' as const,
      title: 'Information',
      message: 'New updates are available for your app.'
    }
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
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as typeof position)}
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-center">Top Center</option>
            </select>
          </div>

          <div className="control-group">
            <label>Animation:</label>
            <select
              value={animationType}
              onChange={(e) => setAnimationType(e.target.value as typeof animationType)}
            >
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
            <button className="clear-btn" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Toast preview area - contained within demo */}
      <div className="toast-preview-area">
        <div className={`toast-container ${position} ${animationType}`}>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} />
          ))}
        </div>
        {toasts.length === 0 && (
          <div className="toast-placeholder">
            Click the buttons above to trigger notifications
          </div>
        )}
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Multiple notification types (success, error, warning, info)</li>
          <li>Configurable positions and animation types</li>
          <li>Auto-dismiss with progress indicators</li>
          <li>Queue management and manual dismissal</li>
          <li>Accessibility support with ARIA attributes</li>
        </ul>
      </div>
    </div>
  );
};

export default ToastNotificationSystem;