/**
 * Animated Modal Dialogs Demo Component
 *
 * Smooth modal animations with backdrop blur, scale transforms, and
 * customizable entry/exit animations using React transitions.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the modal when it opens
      modalRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div 
        className={`modal-content ${animationType} ${size}`}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
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
    {
      id: 'confirm',
      title: 'Confirm Action',
      content: 'Are you sure you want to proceed with this action? This cannot be undone.',
      triggerText: 'Confirmation Modal'
    },
    {
      id: 'success',
      title: 'Success!',
      content: 'Your action has been completed successfully. You can now continue with your workflow.',
      triggerText: 'Success Modal'
    },
    {
      id: 'error',
      title: 'Something Went Wrong',
      content: 'We encountered an error while processing your request. Please try again or contact support.',
      triggerText: 'Error Modal'
    }
  ];

  return (
    <div className={`animated-modal-dialogs-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Animated Modal Dialogs</h4>
        <p>Smooth modal animations with multiple transition types</p>
      </div>

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

        <div className="control-group">
          <label>Modal Size:</label>
          <select
            value={modalSize}
            onChange={(e) => setModalSize(e.target.value as typeof modalSize)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

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

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Multiple animation types (scale, slide, fade, bounce)</li>
          <li>Backdrop blur and click-to-close functionality</li>
          <li>Responsive design with configurable sizes</li>
          <li>Keyboard navigation and accessibility</li>
          <li>Smooth CSS transitions with easing</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimatedModalDialogs;