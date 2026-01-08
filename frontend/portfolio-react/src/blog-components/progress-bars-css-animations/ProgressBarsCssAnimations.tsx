/**
 * Progress Bars with CSS Animations Demo Component
 *
 * Animated progress bars with multiple styles, loading states,
 * and customizable animations using CSS keyframes and React.
 */

import React, { useState, useEffect } from 'react';
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
};

interface ProgressBarsCssAnimationsProps {
  className?: string;
}

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

  const progressExamples = [
    { value: 25, label: 'File Upload' },
    { value: 67, label: 'Data Processing' },
    { value: 89, label: 'Task Completion' },
    { value: 100, label: 'Complete' }
  ];

  return (
    <div className={`progress-bars-css-animations-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Progress Bars with CSS Animations</h4>
        <p>Multiple progress bar styles with smooth animations</p>
      </div>

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

          <div className="control-group">
            <label>Size:</label>
            <select value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="control-group">
            <label>Color:</label>
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="#c26a2d">Orange</option>
              <option value="#4ade80">Green</option>
              <option value="#3b82f6">Blue</option>
              <option value="#ef4444">Red</option>
              <option value="#8b5cf6">Purple</option>
            </select>
          </div>
        </div>

        <div className="control-row">
          <div className="control-group">
            <label>Progress: {progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              disabled={autoProgress}
            />
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
              />
              Animated
            </label>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
              />
              Auto Progress
            </label>
          </div>
        </div>
      </div>

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

        <div className="progress-examples">
          <h5>Examples</h5>
          {progressExamples.map((example, index) => (
            <ProgressBar
              key={index}
              progress={example.value}
              type={type}
              size="small"
              color={color}
              animated={animated}
              label={example.label}
            />
          ))}
        </div>
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Multiple progress bar types (linear, circular, wave, dots)</li>
          <li>Configurable sizes and colors</li>
          <li>Smooth CSS animations with keyframes</li>
          <li>Auto-progress mode for demonstrations</li>
          <li>Responsive design with accessibility support</li>
        </ul>
      </div>
    </div>
  );
};

export default ProgressBarsCssAnimations;