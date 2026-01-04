# Building a Workflow Execution GUI with React

Workflow automation tools like Asana, Zapier, and n8n have popularized visual workflow builders that let users create complex automations without code. In this tutorial, we'll build a workflow execution GUI with real-time progress tracking using React.

## What We're Building

Our workflow execution component includes:

- **Visual workflow nodes** with icons, descriptions, and form fields
- **Real-time execution progress** with animated status indicators
- **Smooth connector animations** showing data flow between steps
- **Multiple node types**: triggers, actions, notifications, and conditions
- **Error state handling** with visual feedback

TIP: Click "Execute Workflow" in the demo above to see the real-time progress animation in action!

## Prerequisites

Before we start, make sure you have:

- React 18+ with TypeScript
- Basic understanding of React state management
- Familiarity with CSS animations and transitions

## Step 1: Defining the Data Types

First, let's define our TypeScript types for workflow nodes and their states:

```tsx
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
```

The `status` field is key - it drives all the visual state changes during execution.

## Step 2: Creating the Node Card Component

Each workflow step is rendered as a card with an icon, title, description, and optional form field:

```tsx
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
        {/* Status indicator badge */}
        <div className={`node-status-indicator status-${node.status}`}>
          {getStatusIndicator()}
        </div>

        {/* Header with icon and title */}
        <div className="node-header">
          <div 
            className="node-icon" 
            style={{ 
              backgroundColor: `${node.color}15`, 
              color: node.color 
            }}
          >
            {node.icon}
          </div>
          <div className="node-title-group">
            <h4 className="node-title">{node.title}</h4>
            <p className="node-description">{node.description}</p>
          </div>
        </div>

        {/* Optional field */}
        {node.field && (
          <div className="node-field">
            <label className="node-field-label">{node.field.label}</label>
            <div className="node-field-value">{node.field.value}</div>
          </div>
        )}
      </div>

      {/* Connector to next node */}
      {!isLast && (
        <div className={`workflow-connector status-${node.status}`}>
          <div className="connector-line" />
          <div className="connector-progress" />
        </div>
      )}
    </div>
  );
};
```

NOTE: The `status-${node.status}` class pattern allows CSS to style each state differently using a single class.

## Step 3: Styling the Workflow Cards

The visual design uses a light card on a dark background, inspired by modern workflow tools:

```css
.workflow-node {
  position: relative;
  width: 260px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  color: #1e293b;
}

/* Status-based border colors */
.workflow-node.status-running {
  box-shadow: 0 0 0 2px #c26a2d;
}

.workflow-node.status-completed {
  box-shadow: 0 0 0 2px #10b981;
}

.workflow-node.status-error {
  box-shadow: 0 0 0 2px #ef4444;
}
```

The status indicator badge appears in the corner:

```css
.node-status-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.node-status-indicator.status-running,
.node-status-indicator.status-completed,
.node-status-indicator.status-error {
  opacity: 1;
  transform: scale(1);
}

.node-status-indicator.status-running {
  background: #c26a2d;
  color: white;
}

.node-status-indicator.status-completed {
  background: #10b981;
  color: white;
}
```

## Step 4: Animating the Connectors

The connectors between nodes show progress as the workflow executes:

```css
.workflow-connector {
  width: 60px;
  height: 3px;
  position: relative;
}

.connector-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: #e2e8f0;
  border-radius: 2px;
}

.connector-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.workflow-connector.status-completed .connector-progress {
  width: 100%;
}

.workflow-connector.status-running .connector-progress {
  width: 50%;
  animation: connectorPulse 1s ease-in-out infinite;
}
```

## Step 5: Implementing the Execution Logic

The execution engine walks through nodes sequentially, updating status as it goes:

```tsx
const executeWorkflow = useCallback(async () => {
  if (isExecuting) return;
  
  resetWorkflow();
  setIsExecuting(true);
  setWorkflowStatus('running');

  for (let i = 0; i < nodes.length; i++) {
    setCurrentStep(i);
    
    // Set current node to running
    setNodes(prev => prev.map((node, idx) => 
      idx === i ? { ...node, status: 'running' as NodeStatus } : node
    ));

    // Simulate execution time
    await new Promise(resolve => 
      setTimeout(resolve, nodes[i].duration || 1000)
    );

    // Set current node to completed
    setNodes(prev => prev.map((node, idx) => 
      idx === i ? { ...node, status: 'completed' as NodeStatus } : node
    ));
  }

  setWorkflowStatus('completed');
  setIsExecuting(false);
}, [isExecuting, nodes, resetWorkflow]);
```

This pattern of updating state in a loop with `await` ensures React re-renders between each step, showing the animation.

## Step 6: Adding a Progress Bar

A progress bar at the top gives users a quick overview of execution status:

```tsx
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
```

## Step 7: Handling Errors

Error handling is crucial for workflows. Here's how to visualize failures:

```tsx
const simulateError = useCallback(async () => {
  if (isExecuting) return;
  
  resetWorkflow();
  setIsExecuting(true);
  setWorkflowStatus('running');

  // Execute first two nodes successfully
  for (let i = 0; i < 2; i++) {
    setNodes(prev => prev.map((node, idx) => 
      idx === i ? { ...node, status: 'running' } : node
    ));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setNodes(prev => prev.map((node, idx) => 
      idx === i ? { ...node, status: 'completed' } : node
    ));
  }

  // Fail on third node
  setNodes(prev => prev.map((node, idx) => 
    idx === 2 ? { ...node, status: 'running' } : node
  ));
  await new Promise(resolve => setTimeout(resolve, 1000));
  setNodes(prev => prev.map((node, idx) => 
    idx === 2 ? { ...node, status: 'error' } : node
  ));

  setWorkflowStatus('error');
  setIsExecuting(false);
}, [isExecuting, resetWorkflow]);
```

WARNING: In production, you'd want to implement retry logic and error recovery mechanisms rather than just stopping execution.

## Step 8: Complete Component

Here's the main demo component bringing it all together:

```tsx
const WorkflowExecutorDemo: React.FC<DemoProps> = ({ className }) => {
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);

  const completedSteps = nodes.filter(n => n.status === 'completed').length;

  return (
    <div className="workflow-executor-demo">
      <ProgressBar 
        current={completedSteps} 
        total={nodes.length} 
        status={workflowStatus}
      />

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

      <div className="demo-controls">
        <button onClick={executeWorkflow} disabled={isExecuting}>
          Execute Workflow
        </button>
        <button onClick={simulateError} disabled={isExecuting}>
          Simulate Error
        </button>
        <button onClick={resetWorkflow} disabled={isExecuting}>
          Reset
        </button>
      </div>
    </div>
  );
};
```

## Extending with React Flow

For more complex workflows with drag-and-drop, branching, and custom edges, consider using [React Flow](https://reactflow.dev/). Here's how you'd integrate it:

```tsx
import ReactFlow, { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
  { id: '2', type: 'action', position: { x: 200, y: 0 }, data: { label: 'Action' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

const WorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={customNodeTypes}
    />
  );
};
```

## Performance Considerations

When dealing with many workflow nodes:

1. **Virtualize the canvas** - Only render visible nodes for large workflows
2. **Debounce state updates** - Batch rapid changes to avoid re-render storms
3. **Use React.memo** - Prevent unnecessary re-renders of unchanged nodes
4. **Optimize SVG icons** - Use a sprite or icon font for many icons

## Accessibility

Make your workflow accessible:

```tsx
// Add ARIA attributes for screen readers
<div 
  role="list" 
  aria-label="Workflow steps"
  className="workflow-nodes"
>
  {nodes.map((node, index) => (
    <div 
      key={node.id}
      role="listitem"
      aria-current={currentStep === index ? 'step' : undefined}
      aria-label={`Step ${index + 1}: ${node.title}, status: ${node.status}`}
    >
      <WorkflowNodeCard node={node} isLast={index === nodes.length - 1} />
    </div>
  ))}
</div>
```

## Conclusion

We've built a visual workflow execution GUI with real-time progress tracking. The key patterns are: status-driven styling, sequential async execution with visual feedback, and clean separation between node rendering and execution logic. This foundation can be extended with drag-and-drop, branching logic, and integration with real workflow engines.

---

## Related Tutorials

- [Building Animated Counters](/blog/animated-counters)
- [Creating Magnetic Button Effects](/blog/magnetic-button-effect)
- [Dropdown Navigation with React](/blog/codrops-dropdown-navigation)
