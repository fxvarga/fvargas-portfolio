/**
 * Magnetic Button Demo Component
 * 
 * Buttons that follow the cursor with a magnetic pull effect,
 * inspired by premium UI interactions.
 */

import React, { useRef, useState } from 'react';
import './MagneticButton.css';

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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <button
      ref={buttonRef}
      className={`magnetic-button ${className} ${isHovered ? 'is-hovered' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      <span 
        className="magnetic-button-content"
        style={{
          transform: `translate(${position.x * 0.3}px, ${position.y * 0.3}px)`,
        }}
      >
        {children}
      </span>
      <span className="magnetic-button-bg" />
    </button>
  );
};

interface DemoProps {
  className?: string;
}

const MagneticButtonDemo: React.FC<DemoProps> = ({ className }) => {
  const [clickCount, setClickCount] = useState(0);
  const [strength, setStrength] = useState(0.35);

  return (
    <div className={`magnetic-button-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Magnetic Buttons</h4>
        <p>Hover over the buttons to see the magnetic effect</p>
      </div>

      <div className="buttons-showcase">
        <MagneticButton 
          strength={strength}
          onClick={() => setClickCount(c => c + 1)}
        >
          <span className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
              <path d="M12 5l7 7-7 7"/>
            </svg>
          </span>
          Get Started
        </MagneticButton>

        <MagneticButton 
          strength={strength} 
          className="secondary"
        >
          Learn More
        </MagneticButton>

        <MagneticButton 
          strength={strength} 
          className="icon-only"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
            <polygon points="10,8 16,12 10,16" fill="currentColor"/>
          </svg>
        </MagneticButton>

        <MagneticButton 
          strength={strength} 
          className="outline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Contact Us
        </MagneticButton>
      </div>

      <div className="demo-controls">
        <div className="control-group">
          <label>Magnetic Strength: {strength.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="0.6"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
          />
        </div>
        <div className="click-counter">
          Clicks: <span>{clickCount}</span>
        </div>
      </div>

      <div className="demo-info">
        <h5>How It Works</h5>
        <ul>
          <li>Track mouse position relative to button center</li>
          <li>Apply transform based on cursor distance</li>
          <li>Inner content moves at a reduced rate for depth</li>
          <li>Smooth transition back on mouse leave</li>
        </ul>
      </div>
    </div>
  );
};

export default MagneticButtonDemo;
