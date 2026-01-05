/**
 * Workflow Executor Demo Component
 *
 * A visual workflow execution GUI using React Flow (xyflow/react)
 * with real-time progress tracking, custom nodes, and animated edges.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./WorkflowExecutor.css";

// ============================================================================
// Types
// ============================================================================

type NodeStatus = "idle" | "running" | "completed" | "error";

interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  type: "trigger" | "action" | "notification" | "condition";
  color: string;
  field?: {
    label: string;
    value: string;
  };
  status: NodeStatus;
  duration?: number;
}

// ============================================================================
// Icons
// ============================================================================

const TriggerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ActionIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const NotificationIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ConditionIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <polyline points="17 7 12 2 7 7" />
    <polyline points="17 17 12 22 7 17" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="spinner"
  >
    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// ============================================================================
// Custom Workflow Node Component
// ============================================================================

const getNodeIcon = (type: string) => {
  switch (type) {
    case "trigger":
      return <TriggerIcon />;
    case "action":
      return <ActionIcon />;
    case "notification":
      return <NotificationIcon />;
    case "condition":
      return <ConditionIcon />;
    default:
      return <ActionIcon />;
  }
};

const getStatusIndicator = (status: NodeStatus) => {
  switch (status) {
    case "running":
      return <SpinnerIcon />;
    case "completed":
      return <CheckIcon />;
    case "error":
      return <ErrorIcon />;
    default:
      return null;
  }
};

const WorkflowNode: React.FC<NodeProps<Node<WorkflowNodeData>>> = ({
  data,
}) => {
  const nodeData = data as WorkflowNodeData;

  return (
    <div className={`workflow-node status-${nodeData.status}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle"
      />

      {/* Status Indicator */}
      <div className={`node-status-indicator status-${nodeData.status}`}>
        {getStatusIndicator(nodeData.status)}
      </div>

      {/* Header */}
      <div className="node-header">
        <div
          className="node-icon"
          style={{
            backgroundColor: `${nodeData.color}15`,
            color: nodeData.color,
          }}
        >
          {getNodeIcon(nodeData.type)}
        </div>
        <div className="node-title-group">
          <h4 className="node-title">{nodeData.label}</h4>
          <p className="node-description">{nodeData.description}</p>
        </div>
      </div>

      {/* Field */}
      {nodeData.field && (
        <div className="node-field">
          <label className="node-field-label">{nodeData.field.label}</label>
          <div className="node-field-value">{nodeData.field.value}</div>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle"
      />
    </div>
  );
};

// Register custom node types
const nodeTypes = {
  workflow: WorkflowNode,
};

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
  status: "idle" | "running" | "completed" | "error";
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  status,
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="workflow-progress">
      <div className="progress-header">
        <span className="progress-label">
          {status === "idle" && "Ready to execute"}
          {status === "running" &&
            `Executing step ${current + 1} of ${total}...`}
          {status === "completed" && "Workflow completed successfully"}
          {status === "error" && "Workflow failed"}
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
// Initial Nodes and Edges
// ============================================================================

const createInitialNodes = (): Node<WorkflowNodeData>[] => [
  {
    id: "1",
    type: "workflow",
    position: { x: 0, y: 100 },
    data: {
      label: "When a task is assigned",
      description: "This workflow starts when a user is assigned a new task",
      type: "trigger",
      color: "#8b5cf6",
      field: { label: "Trigger Details", value: "Any task in any project" },
      status: "idle",
      duration: 800,
    },
  },
  {
    id: "2",
    type: "workflow",
    position: { x: 350, y: 100 },
    data: {
      label: "Add to 'My Tasks'",
      description: "Automatically adds task to the assignee's personal list",
      type: "action",
      color: "#10b981",
      field: { label: "View", value: "Assignee's 'My Tasks'" },
      status: "idle",
      duration: 1200,
    },
  },
  {
    id: "3",
    type: "workflow",
    position: { x: 700, y: 50 },
    data: {
      label: "Send in-app notification",
      description: "Alerts the assignee within the application",
      type: "notification",
      color: "#06b6d4",
      field: { label: "Message", value: "You have a new task: {{task_name}}" },
      status: "idle",
      duration: 600,
    },
  },
  {
    id: "4",
    type: "workflow",
    position: { x: 700, y: 200 },
    data: {
      label: "Check Priority",
      description: "Evaluate task priority for additional actions",
      type: "condition",
      color: "#f43f5e",
      field: { label: "Condition", value: 'priority === "high"' },
      status: "idle",
      duration: 500,
    },
  },
  {
    id: "5",
    type: "workflow",
    position: { x: 1050, y: 50 },
    data: {
      label: "Send Email Alert",
      description: "Notify manager about high priority task",
      type: "notification",
      color: "#f59e0b",
      field: { label: "Recipient", value: "manager@company.com" },
      status: "idle",
      duration: 700,
    },
  },
  {
    id: "6",
    type: "workflow",
    position: { x: 1050, y: 200 },
    data: {
      label: "Log to Analytics",
      description: "Record task assignment in analytics system",
      type: "action",
      color: "#64748b",
      field: { label: "Event", value: "task_assigned" },
      status: "idle",
      duration: 400,
    },
  },
];

const createInitialEdges = (): Edge[] => [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    label: "Yes",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
    labelStyle: { fill: "#94a3b8", fontSize: 12 },
    labelBgStyle: { fill: "#1a1a2e", fillOpacity: 0.8 },
  },
  {
    id: "e4-6",
    source: "4",
    target: "6",
    label: "No",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
    labelStyle: { fill: "#94a3b8", fontSize: 12 },
    labelBgStyle: { fill: "#1a1a2e", fillOpacity: 0.8 },
  },
];

// Execution order for the workflow (BFS-like traversal)
const executionOrder = ["1", "2", "3", "4", "5", "6"];

// ============================================================================
// Demo Component
// ============================================================================

interface DemoProps {
  className?: string;
}

const WorkflowExecutorDemo: React.FC<DemoProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<WorkflowNodeData>>(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [, setCurrentStep] = useState(-1);

  // Reset workflow to initial state
  const resetWorkflow = useCallback(() => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
    setIsExecuting(false);
    setWorkflowStatus("idle");
    setCurrentStep(-1);
  }, [setNodes, setEdges]);

  // Update node status
  const updateNodeStatus = useCallback(
    (nodeId: string, status: NodeStatus) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, status } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  // Update edge animation based on source node status
  const updateEdgeAnimation = useCallback(
    (sourceId: string, animated: boolean, completed: boolean) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.source === sourceId
            ? {
                ...edge,
                animated,
                style: {
                  ...edge.style,
                  stroke: completed
                    ? "#10b981"
                    : animated
                      ? "#c26a2d"
                      : "#64748b",
                  strokeWidth: 2,
                },
              }
            : edge,
        ),
      );
    },
    [setEdges],
  );

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;

    resetWorkflow();
    // Small delay to let reset take effect
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsExecuting(true);
    setWorkflowStatus("running");

    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      setCurrentStep(i);

      // Set current node to running
      updateNodeStatus(nodeId, "running");
      updateEdgeAnimation(nodeId, true, false);

      // Get node duration
      const node = createInitialNodes().find((n) => n.id === nodeId);
      const duration = node?.data.duration || 1000;

      // Wait for execution
      await new Promise((resolve) =>
        setTimeout(resolve, duration * (executionSpeed / 1000)),
      );

      // Set current node to completed
      updateNodeStatus(nodeId, "completed");
      updateEdgeAnimation(nodeId, false, true);
    }

    setWorkflowStatus("completed");
    setIsExecuting(false);
  }, [
    isExecuting,
    executionSpeed,
    resetWorkflow,
    updateNodeStatus,
    updateEdgeAnimation,
  ]);

  // Simulate error
  const simulateError = useCallback(async () => {
    if (isExecuting) return;

    resetWorkflow();
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsExecuting(true);
    setWorkflowStatus("running");

    // Execute first two nodes successfully
    for (let i = 0; i < 2; i++) {
      const nodeId = executionOrder[i];
      setCurrentStep(i);
      updateNodeStatus(nodeId, "running");
      updateEdgeAnimation(nodeId, true, false);
      await new Promise((resolve) => setTimeout(resolve, executionSpeed));
      updateNodeStatus(nodeId, "completed");
      updateEdgeAnimation(nodeId, false, true);
    }

    // Fail on third node
    const failNodeId = executionOrder[2];
    setCurrentStep(2);
    updateNodeStatus(failNodeId, "running");
    updateEdgeAnimation(failNodeId, true, false);
    await new Promise((resolve) => setTimeout(resolve, executionSpeed));
    updateNodeStatus(failNodeId, "error");

    // Update edge to error state
    setEdges((eds) =>
      eds.map((edge) =>
        edge.source === failNodeId
          ? {
              ...edge,
              animated: false,
              style: { ...edge.style, stroke: "#ef4444" },
            }
          : edge,
      ),
    );

    setWorkflowStatus("error");
    setIsExecuting(false);
  }, [
    isExecuting,
    executionSpeed,
    resetWorkflow,
    updateNodeStatus,
    updateEdgeAnimation,
    setEdges,
  ]);

  // Calculate completed steps for progress
  const completedSteps = useMemo(
    () => nodes.filter((n) => n.data.status === "completed").length,
    [nodes],
  );

  return (
    <div className={`workflow-executor-demo ${className || ""}`}>
      <div className="demo-header">
        <h4>Workflow Execution with React Flow</h4>
        <p>Interactive workflow builder with real-time execution progress</p>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        current={completedSteps}
        total={nodes.length}
        status={workflowStatus}
      />

      {/* React Flow Canvas */}
      <div className="workflow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
          />
          <Controls className="workflow-controls" />
          <MiniMap
            className="workflow-minimap"
            nodeColor={(node) => {
              const data = node.data as WorkflowNodeData;
              return data.color;
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        </ReactFlow>
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="demo-info">
        <h5>React Flow Features Used</h5>
        <ul>
          <li>
            <strong>Custom Nodes</strong> - Workflow cards with status
            indicators
          </li>
          <li>
            <strong>Animated Edges</strong> - Show data flow during execution
          </li>
          <li>
            <strong>Background</strong> - Dot pattern for professional look
          </li>
          <li>
            <strong>Controls</strong> - Zoom and pan controls
          </li>
          <li>
            <strong>MiniMap</strong> - Overview with status colors
          </li>
          <li>
            <strong>Branching</strong> - Conditional paths (Yes/No labels)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowExecutorDemo;
