/**
 * AI Thinking Skeleton Demo Component
 *
 * Shimmer / pulse skeleton animations for AI response loading states.
 * Multiple layout variants for different content types.
 */

import React, { useState } from 'react';
import './AiThinkingSkeleton.css';

// --- Core Skeleton Components ---

type SkeletonVariant = 'shimmer' | 'pulse' | 'wave';

interface SkeletonLineProps {
  width?: string;
  height?: string;
  variant: SkeletonVariant;
  className?: string;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = '14px',
  variant,
  className = '',
}) => (
  <div
    className={`skeleton-line skeleton-${variant} ${className}`}
    style={{ width, height }}
    role="presentation"
    aria-hidden="true"
  />
);

interface SkeletonCircleProps {
  size?: string;
  variant: SkeletonVariant;
}

const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size = '36px', variant }) => (
  <div
    className={`skeleton-circle skeleton-${variant}`}
    style={{ width: size, height: size }}
    role="presentation"
    aria-hidden="true"
  />
);

// --- Layout Templates ---

interface SkeletonLayoutProps {
  variant: SkeletonVariant;
}

const ChatResponseSkeleton: React.FC<SkeletonLayoutProps> = ({ variant }) => (
  <div className="skeleton-layout skeleton-chat-response">
    <SkeletonCircle variant={variant} />
    <div className="skeleton-chat-body">
      <SkeletonLine variant={variant} width="120px" height="12px" className="skeleton-sender" />
      <SkeletonLine variant={variant} width="100%" />
      <SkeletonLine variant={variant} width="92%" />
      <SkeletonLine variant={variant} width="78%" />
      <SkeletonLine variant={variant} width="45%" />
    </div>
  </div>
);

const CodeBlockSkeleton: React.FC<SkeletonLayoutProps> = ({ variant }) => (
  <div className="skeleton-layout skeleton-code-block">
    <div className="skeleton-code-header">
      <SkeletonLine variant={variant} width="80px" height="12px" />
      <SkeletonLine variant={variant} width="50px" height="12px" />
    </div>
    <div className="skeleton-code-body">
      <SkeletonLine variant={variant} width="60%" />
      <SkeletonLine variant={variant} width="85%" />
      <SkeletonLine variant={variant} width="40%" />
      <SkeletonLine variant={variant} width="75%" />
      <SkeletonLine variant={variant} width="55%" />
    </div>
  </div>
);

const CardSkeleton: React.FC<SkeletonLayoutProps> = ({ variant }) => (
  <div className="skeleton-layout skeleton-card">
    <SkeletonLine variant={variant} width="100%" height="120px" className="skeleton-card-image" />
    <div className="skeleton-card-body">
      <SkeletonLine variant={variant} width="70%" height="18px" />
      <SkeletonLine variant={variant} width="100%" />
      <SkeletonLine variant={variant} width="85%" />
      <div className="skeleton-card-footer">
        <SkeletonCircle variant={variant} size="24px" />
        <SkeletonLine variant={variant} width="100px" height="12px" />
      </div>
    </div>
  </div>
);

const AnalysisSkeleton: React.FC<SkeletonLayoutProps> = ({ variant }) => (
  <div className="skeleton-layout skeleton-analysis">
    <div className="skeleton-analysis-header">
      <SkeletonLine variant={variant} width="40%" height="18px" />
      <SkeletonLine variant={variant} width="60px" height="24px" className="skeleton-badge" />
    </div>
    <div className="skeleton-analysis-metrics">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-metric">
          <SkeletonLine variant={variant} width="60%" height="12px" />
          <SkeletonLine variant={variant} width="80%" height="28px" />
        </div>
      ))}
    </div>
    <SkeletonLine variant={variant} width="100%" />
    <SkeletonLine variant={variant} width="90%" />
  </div>
);

// --- Demo Wrapper ---

interface DemoProps {
  className?: string;
}

type LayoutType = 'chat' | 'code' | 'card' | 'analysis';

const layouts: { key: LayoutType; label: string }[] = [
  { key: 'chat', label: 'Chat Response' },
  { key: 'code', label: 'Code Block' },
  { key: 'card', label: 'Content Card' },
  { key: 'analysis', label: 'Analysis Panel' },
];

const AiThinkingSkeletonDemo: React.FC<DemoProps> = ({ className }) => {
  const [variant, setVariant] = useState<SkeletonVariant>('shimmer');
  const [activeLayout, setActiveLayout] = useState<LayoutType>('chat');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  const renderSkeleton = () => {
    const props = { variant };
    switch (activeLayout) {
      case 'chat':
        return <ChatResponseSkeleton {...props} />;
      case 'code':
        return <CodeBlockSkeleton {...props} />;
      case 'card':
        return <CardSkeleton {...props} />;
      case 'analysis':
        return <AnalysisSkeleton {...props} />;
    }
  };

  return (
    <div className={`ai-thinking-skeleton-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>AI Thinking Skeleton</h4>
        <p>Shimmer and pulse loading animations for AI response states</p>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Animation:</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as SkeletonVariant)}
            >
              <option value="shimmer">Shimmer</option>
              <option value="pulse">Pulse</option>
              <option value="wave">Wave</option>
            </select>
          </div>
          <div className="control-group">
            <label>Speed:</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as typeof speed)}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>
        <div className="control-row">
          <div className="notification-buttons">
            {layouts.map((layout) => (
              <button
                key={layout.key}
                className={`notification-btn ${activeLayout === layout.key ? 'info active-layout' : 'info'}`}
                onClick={() => setActiveLayout(layout.key)}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`skeleton-preview-area speed-${speed}`} role="status" aria-label="Loading content">
        {renderSkeleton()}
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Three animation variants: shimmer, pulse, and wave</li>
          <li>Four layout templates: chat, code, card, and analysis</li>
          <li>Configurable animation speed</li>
          <li>Composable skeleton primitives (lines, circles)</li>
          <li>Proper ARIA attributes for accessibility</li>
          <li>Reduced motion support</li>
        </ul>
      </div>
    </div>
  );
};

export default AiThinkingSkeletonDemo;
