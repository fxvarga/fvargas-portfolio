/**
 * AI Tool Call Card Demo Component
 *
 * Expandable cards showing agent tool execution with status indicators,
 * input/output panels, and animated state transitions.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './AiToolCallCard.css';

// --- Core Tool Call Card ---

type ToolStatus = 'pending' | 'running' | 'success' | 'error';

interface ToolCallData {
  id: string;
  toolName: string;
  description: string;
  status: ToolStatus;
  input: Record<string, unknown>;
  output?: string;
  duration?: number;
  error?: string;
}

interface ToolCallCardProps {
  tool: ToolCallData;
  defaultExpanded?: boolean;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ tool, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, tool.status, tool.output]);

  const statusIcons: Record<ToolStatus, string> = {
    pending: '⏳',
    running: '⚡',
    success: '✓',
    error: '✕',
  };

  const statusLabels: Record<ToolStatus, string> = {
    pending: 'Pending',
    running: 'Running',
    success: 'Completed',
    error: 'Failed',
  };

  return (
    <div
      className={`tool-call-card tool-status-${tool.status}`}
      role="region"
      aria-label={`Tool call: ${tool.toolName}`}
    >
      <button
        className="tool-call-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="tool-call-icon">
          <span className={`status-icon status-${tool.status}`}>
            {statusIcons[tool.status]}
          </span>
        </div>
        <div className="tool-call-info">
          <span className="tool-call-name">{tool.toolName}</span>
          <span className="tool-call-desc">{tool.description}</span>
        </div>
        <div className="tool-call-meta">
          <span className={`tool-status-badge badge-${tool.status}`}>
            {statusLabels[tool.status]}
          </span>
          {tool.duration !== undefined && (
            <span className="tool-duration">{tool.duration}ms</span>
          )}
          <span className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>▾</span>
        </div>
      </button>

      <div
        className={`tool-call-body ${isExpanded ? 'expanded' : ''}`}
        style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="tool-call-body-inner">
          <div className="tool-panel">
            <div className="tool-panel-header">Input</div>
            <pre className="tool-panel-code">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>

          {tool.output && (
            <div className="tool-panel">
              <div className="tool-panel-header">Output</div>
              <pre className="tool-panel-code">{tool.output}</pre>
            </div>
          )}

          {tool.error && (
            <div className="tool-panel tool-panel-error">
              <div className="tool-panel-header">Error</div>
              <pre className="tool-panel-code">{tool.error}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Demo Wrapper ---

interface DemoProps {
  className?: string;
}

const demoToolCalls: ToolCallData[] = [
  {
    id: '1',
    toolName: 'web_search',
    description: 'Search the web for React 19 features',
    status: 'success',
    input: { query: 'React 19 new features 2026', max_results: 5 },
    output: 'Found 5 results:\n1. React 19 Server Components\n2. New use() hook\n3. Document metadata support\n4. Asset loading improvements\n5. Enhanced Suspense boundaries',
    duration: 342,
  },
  {
    id: '2',
    toolName: 'code_interpreter',
    description: 'Calculate performance metrics from benchmark data',
    status: 'running',
    input: { code: 'import pandas as pd\ndf = pd.read_csv("benchmarks.csv")\ndf.describe()', language: 'python' },
  },
  {
    id: '3',
    toolName: 'file_read',
    description: 'Read the project configuration file',
    status: 'success',
    input: { path: '/app/config/settings.json' },
    output: '{\n  "theme": "dark",\n  "apiVersion": "v2",\n  "features": ["ai-chat", "analytics"]\n}',
    duration: 18,
  },
  {
    id: '4',
    toolName: 'api_request',
    description: 'Fetch user profile from authentication service',
    status: 'error',
    input: { url: 'https://api.example.com/users/me', method: 'GET' },
    error: 'Error 401: Unauthorized — Token expired at 2026-02-18T23:59:59Z. Please re-authenticate.',
    duration: 156,
  },
  {
    id: '5',
    toolName: 'database_query',
    description: 'Query recent orders from the database',
    status: 'pending',
    input: { sql: 'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 7 DAY LIMIT 10', database: 'production' },
  },
];

const AiToolCallCardDemo: React.FC<DemoProps> = ({ className }) => {
  const [toolCalls, setToolCalls] = useState<ToolCallData[]>(demoToolCalls);
  const [autoAnimate, setAutoAnimate] = useState(false);

  const resetTools = useCallback(() => {
    setToolCalls(demoToolCalls);
  }, []);

  const simulateExecution = useCallback(() => {
    setAutoAnimate(true);

    // Reset all to pending first
    const pendingTools = demoToolCalls.map((t) => ({
      ...t,
      status: 'pending' as ToolStatus,
      output: undefined,
      error: undefined,
      duration: undefined,
    }));
    setToolCalls(pendingTools);

    // Animate each tool call sequentially
    demoToolCalls.forEach((tool, index) => {
      // Set to running
      setTimeout(() => {
        setToolCalls((prev) =>
          prev.map((t, i) => (i === index ? { ...t, status: 'running' } : t))
        );
      }, index * 1200 + 400);

      // Set to final state
      setTimeout(() => {
        setToolCalls((prev) =>
          prev.map((t, i) => (i === index ? { ...demoToolCalls[i] } : t))
        );
        if (index === demoToolCalls.length - 1) {
          setAutoAnimate(false);
        }
      }, index * 1200 + 1200);
    });
  }, []);

  return (
    <div className={`ai-tool-call-card-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>AI Tool Call Card</h4>
        <p>Expandable cards showing agent tool execution with live status</p>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="notification-buttons">
            <button
              className="notification-btn info"
              onClick={simulateExecution}
              disabled={autoAnimate}
            >
              {autoAnimate ? 'Running...' : 'Simulate Execution'}
            </button>
            <button className="clear-btn" onClick={resetTools}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="tool-calls-list">
        {toolCalls.map((tool, index) => (
          <ToolCallCard
            key={tool.id}
            tool={tool}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Four status states: pending, running, success, error</li>
          <li>Expandable input/output panels with smooth animation</li>
          <li>Animated status transitions during execution</li>
          <li>Duration tracking for completed tool calls</li>
          <li>Error display with distinct styling</li>
          <li>Accessible with ARIA attributes and keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
};

export default AiToolCallCardDemo;
