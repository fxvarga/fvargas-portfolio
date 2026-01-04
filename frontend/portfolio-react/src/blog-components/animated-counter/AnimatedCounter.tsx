/**
 * Animated Counter Demo Component
 * 
 * A smooth number counter that animates from 0 to target values
 * with easing and intersection observer for scroll-triggered animation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AnimatedCounter.css';

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
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [animate, hasAnimated]);

  const displayValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.round(count).toLocaleString();

  return (
    <div className="counter-item" ref={counterRef}>
      <div className="counter-value">
        {prefix}
        <span className="counter-number">{displayValue}</span>
        {suffix}
      </div>
      <div className="counter-label">{label}</div>
    </div>
  );
};

interface AnimatedCounterProps {
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ className }) => {
  const [isReset, setIsReset] = useState(false);

  const handleReset = () => {
    setIsReset(true);
    setTimeout(() => setIsReset(false), 100);
  };

  return (
    <div className={`animated-counter-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Animated Counter</h4>
        <p>Scroll-triggered number animations with easing</p>
      </div>

      {!isReset && (
        <div className="counters-grid">
          <Counter end={12} suffix="+" label="Years Experience" duration={2000} />
          <Counter end={150} suffix="+" label="Projects Completed" duration={2500} />
          <Counter end={98.5} suffix="%" label="Client Satisfaction" decimals={1} duration={2200} />
          <Counter end={50} suffix="K+" label="Lines of Code" duration={2800} />
        </div>
      )}

      <div className="demo-controls">
        <button onClick={handleReset} className="reset-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Replay Animation
        </button>
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Intersection Observer for scroll-triggered start</li>
          <li>Eased animation using easeOutQuart</li>
          <li>Configurable duration, prefix, suffix, and decimals</li>
          <li>Number formatting with locale support</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimatedCounter;
