/**
 * Workflow Executor Demo Component
 * 
 * A visual workflow execution GUI with real-time progress tracking,
 * inspired by modern workflow automation tools like Asana, Zapier, and n8n.
 */

import React, { useState, useCallback, useMemo } from 'react';
import './WorkflowExecutor.css';

// ============================================================================
// Types
// ============================================================================

type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'notification' | 'condition';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  field?: {
    label: string;
    value: string;
  };
  status: NodeStatus;
  duration?: number; // ms to complete
}

// ============================================================================
// Icons
// ============================================================================

const TriggerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ActionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const NotificationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ConditionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="2" x2="12" y2="22" />
    <polyline points="17 7 12 2 7 7" />
    <polyline points="17 17 12 22 7 17" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner">
    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// ============================================================================
// Workflow Node Component
// ============================================================================

interface WorkflowNodeCardProps {
  node: WorkflowNode;
  isLast: boolean;
}

const WorkflowNodeCard: React.FC<WorkflowNodeCardProps> = ({ node, isLast }) => {
  const getStatusIndicator = () => {
    switch (node.status) {
      case 'running':
        return <SpinnerIcon />;
      case 'completed':
        return <CheckIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  return (
    <div className={`workflow-node-wrapper ${isLast ? 'is-last' : ''}`}>
      <div className={`workflow-node status-${node.status}`}>
        {/* Status indicator */}
        <div className={`node-status-indicator status-${node.status}`}>
          {getStatusIndicator()}
        </div>

        {/* Header */}
        <div className="node-header">
          <div className="node-icon" style={{ backgroundColor: `${node.color}15`, color: node.color }}>
            {node.icon}
          </div>
          <div className="node-title-group">
            <h4 className="node-title">{node.title}</h4>
            <p className="node-description">{node.description}</p>
          </div>
          <button className="node-menu-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Field */}
        {node.field && (
          <div className="node-field">
            <label className="node-field-label">{node.field.label}</label>
            <div className="node-field-value">{node.field.value}</div>
          </div>
        )}

        {/* Add button */}
        <button className="node-add-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Connector */}
      {!isLast && (
        <div className={`workflow-connector status-${node.status}`}>
          <div className="connector-line" />
          <div className="connector-progress" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, status }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="workflow-progress">
      <div className="progress-header">
        <span className="progress-label">
          {status === 'idle' && 'Ready to execute'}
          {status === 'running' && `Executing step ${current + 1} of ${total}...`}
          {status === 'completed' && 'Workflow completed successfully'}
          {status === 'error' && 'Workflow failed'}
        </span>
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className={`progress-fill status-${status}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Demo Component
// ============================================================================

interface DemoProps {
  className?: string;
}

const WorkflowExecutorDemo: React.FC<DemoProps> = ({ className }) => {
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  const initialNodes: WorkflowNode[] = useMemo(() => [
    {
      id: '1',
      type: 'trigger',
      title: "When a task is assigned",
      description: "This workflow starts when a user is assigned a new task",
      icon: <TriggerIcon />,
      color: '#8b5cf6',
      field: {
        label: 'Trigger Details',
        value: 'Any task in any project'
      },
      status: 'idle',
      duration: 800
    },
    {
      id: '2',
      type: 'action',
      title: "Add to 'My Tasks'",
      description: "Automatically adds task to the assignee's personal list",
      icon: <ActionIcon />,
      color: '#10b981',
      field: {
        label: 'View',
        value: "Assignee's 'My Tasks'"
      },
      status: 'idle',
      duration: 1200
    },
    {
      id: '3',
      type: 'notification',
      title: "Send in-app notification",
      description: "Alerts the assignee within the application",
      icon: <NotificationIcon />,
      color: '#06b6d4',
      field: {
        label: 'Notification Message',
        value: 'You have a new task: {{task_name}}'
      },
      status: 'idle',
      duration: 600
    },
    {
      id: '4',
      type: 'condition',
      title: "Task is High Priority",
      description: "Run different actions based on task attributes",
      icon: <ConditionIcon />,
      color: '#f43f5e',
      field: {
        label: 'Branching condition',
        value: 'Based on task priority'
      },
      status: 'idle',
      duration: 500
    }
  ], []);

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);

  const resetWorkflow = useCallback(() => {
    setNodes(initialNodes);
    setIsExecuting(false);
    setWorkflowStatus('idle');
  }, [initialNodes]);

  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;
    
    resetWorkflow();
    setIsExecuting(true);
    setWorkflowStatus('running');

    for (let i = 0; i < initialNodes.length; i++) {
      // Set current node to running
      setNodes(prev => prev.map((node, idx) => 
        idx === i ? { ...node, status: 'running' as NodeStatus } : node
      ));

      // Wait for execution (scaled by speed)
      await new Promise(resolve => 
        setTimeout(resolve, (initialNodes[i].duration || 1000) * (executionSpeed / 1000))
      );

      // Set current node to completed
      setNodes(prev => prev.map((node, idx) => 
        idx === i ? { ...node, status: 'completed' as NodeStatus } : node
      ));
    }

    setWorkflowStatus('completed');
    setIsExecuting(false);
  }, [isExecuting, executionSpeed, resetWorkflow, initialNodes]);

  const simulateError = useCallback(async () => {
    if (isExecuting) return;
    
    resetWorkflow();
    setIsExecuting(true);
    setWorkflowStatus('running');

    // Execute first two nodes
    for (let i = 0; i < 2; i++) {
      setNodes(prev => prev.map((node, idx) => 
        idx === i ? { ...node, status: 'running' as NodeStatus } : node
      ));
      await new Promise(resolve => setTimeout(resolve, executionSpeed));
      setNodes(prev => prev.map((node, idx) => 
        idx === i ? { ...node, status: 'completed' as NodeStatus } : node
      ));
    }

    // Fail on third node
    setNodes(prev => prev.map((node, idx) => 
      idx === 2 ? { ...node, status: 'running' as NodeStatus } : node
    ));
    await new Promise(resolve => setTimeout(resolve, executionSpeed));
    setNodes(prev => prev.map((node, idx) => 
      idx === 2 ? { ...node, status: 'error' as NodeStatus } : node
    ));

    setWorkflowStatus('error');
    setIsExecuting(false);
  }, [isExecuting, executionSpeed, resetWorkflow]);

  // Calculate completed steps for progress
  const completedSteps = nodes.filter(n => n.status === 'completed').length;

  return (
    <div className={`workflow-executor-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Workflow Execution GUI</h4>
        <p>Visual workflow builder with real-time execution progress</p>
      </div>

      {/* Progress Bar */}
      <ProgressBar 
        current={completedSteps} 
        total={nodes.length} 
        status={workflowStatus}
      />

      {/* Workflow Canvas */}
      <div className="workflow-canvas">
        <div className="workflow-nodes">
          {nodes.map((node, index) => (
            <WorkflowNodeCard 
              key={node.id} 
              node={node} 
              isLast={index === nodes.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Execution Speed: {executionSpeed}ms</label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={executionSpeed}
              onChange={(e) => setExecutionSpeed(parseInt(e.target.value))}
              disabled={isExecuting}
            />
          </div>
        </div>
        
        <div className="control-buttons">
          <button 
            className="execute-btn"
            onClick={executeWorkflow}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <SpinnerIcon /> Executing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Execute Workflow
              </>
            )}
          </button>
          
          <button 
            className="error-btn"
            onClick={simulateError}
            disabled={isExecuting}
          >
            <ErrorIcon /> Simulate Error
          </button>
          
          <button 
            className="reset-btn"
            onClick={resetWorkflow}
            disabled={isExecuting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Visual workflow nodes with status indicators</li>
          <li>Real-time execution progress tracking</li>
          <li>Animated connectors showing data flow</li>
          <li>Support for triggers, actions, notifications, and conditions</li>
          <li>Error state handling and recovery</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowExecutorDemo;
