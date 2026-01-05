# Building a Workflow Execution GUI with React Flow

React Flow is the go-to library for building node-based editors, workflow builders, and interactive diagrams. In this tutorial, we'll build a visual workflow execution GUI with real-time progress tracking, animated edges, and custom nodes using React Flow.

## What We're Building

Our workflow execution component includes:

- **Custom workflow nodes** with status indicators and form fields
- **Animated edges** showing data flow during execution
- **Branching logic** with conditional paths (Yes/No)
- **MiniMap** for overview navigation
- **Controls** for zoom and pan
- **Real-time execution progress** with visual feedback

TIP: Click "Execute Workflow" in the demo above to see the real-time progress animation in action! Try dragging nodes to rearrange the workflow.

## Prerequisites

Before we start, make sure you have:

- React 18+ with TypeScript
- Basic understanding of React hooks
- Familiarity with React Flow concepts (nodes, edges, handles)

## Step 1: Install React Flow

Install the React Flow package:

```bash
npm install @xyflow/react
```

Then import the required components and styles:

```tsx
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

## Step 2: Define Your Data Types

Create TypeScript interfaces for type-safe workflow operations:

```tsx
type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

interface WorkflowNodeData {
  label: string;
  description: string;
  type: 'trigger' | 'action' | 'notification' | 'condition';
  color: string;
  field?: {
    label: string;
    value: string;
  };
  status: NodeStatus;
  duration?: number; // ms to complete
}
```

NOTE: React Flow nodes have a generic `data` property that we extend with our custom `WorkflowNodeData` interface.

## Step 3: Create Custom Node Components

React Flow allows you to create custom node components for rich UI:

```tsx
const WorkflowNode: React.FC<NodeProps<Node<WorkflowNodeData>>> = ({ data }) => {
  const nodeData = data as WorkflowNodeData;
  
  return (
    <div className={`workflow-node status-${nodeData.status}`}>
      {/* Input Handle - where edges connect FROM other nodes */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="workflow-handle"
      />
      
      {/* Status Indicator Badge */}
      <div className={`node-status-indicator status-${nodeData.status}`}>
        {getStatusIndicator(nodeData.status)}
      </div>

      {/* Node Content */}
      <div className="node-header">
        <div className="node-icon" style={{ backgroundColor: `${nodeData.color}15` }}>
          {getNodeIcon(nodeData.type)}
        </div>
        <div className="node-title-group">
          <h4 className="node-title">{nodeData.label}</h4>
          <p className="node-description">{nodeData.description}</p>
        </div>
      </div>

      {/* Optional Field */}
      {nodeData.field && (
        <div className="node-field">
          <label>{nodeData.field.label}</label>
          <div>{nodeData.field.value}</div>
        </div>
      )}

      {/* Output Handle - where edges connect TO other nodes */}
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
```

Key concepts:
- **Handle** components define connection points for edges
- `type="target"` receives incoming connections
- `type="source"` creates outgoing connections
- `position` determines where on the node the handle appears

## Step 4: Define Initial Nodes and Edges

Create your workflow structure with nodes and edges:

```tsx
const createInitialNodes = (): Node<WorkflowNodeData>[] => [
  {
    id: '1',
    type: 'workflow', // Uses our custom node type
    position: { x: 0, y: 100 },
    data: {
      label: 'When a task is assigned',
      description: 'Workflow trigger',
      type: 'trigger',
      color: '#8b5cf6',
      status: 'idle',
      duration: 800,
    },
  },
  {
    id: '2',
    type: 'workflow',
    position: { x: 350, y: 100 },
    data: {
      label: "Add to 'My Tasks'",
      description: 'Automatic action',
      type: 'action',
      color: '#10b981',
      status: 'idle',
      duration: 1200,
    },
  },
  // ... more nodes
];

const createInitialEdges = (): Edge[] => [
  { 
    id: 'e1-2', 
    source: '1',  // From node with id '1'
    target: '2',  // To node with id '2'
    animated: false,
    style: { stroke: '#64748b', strokeWidth: 2 },
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3',
    label: 'Yes',  // Edge labels for branching
    labelStyle: { fill: '#94a3b8' },
  },
  // ... more edges
];
```

## Step 5: Set Up the React Flow Canvas

Use React Flow's hooks for state management:

```tsx
const WorkflowExecutorDemo: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());

  return (
    <div className="workflow-canvas" style={{ height: 400 }}>
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
      >
        <Background variant={BackgroundVariant.Dots} gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as WorkflowNodeData;
            if (data.status === 'completed') return '#10b981';
            if (data.status === 'running') return '#c26a2d';
            return data.color;
          }}
        />
      </ReactFlow>
    </div>
  );
};
```

Key props:
- `fitView` - Automatically fits all nodes in the viewport
- `nodeTypes` - Registers our custom node component
- `onNodesChange` / `onEdgesChange` - Handles drag, select, and delete

## Step 6: Implement Workflow Execution

The execution logic updates node status sequentially:

```tsx
// Update a single node's status
const updateNodeStatus = useCallback((nodeId: string, status: NodeStatus) => {
  setNodes((nds) =>
    nds.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status } }
        : node
    )
  );
}, [setNodes]);

// Update edge animation based on execution state
const updateEdgeAnimation = useCallback((sourceId: string, animated: boolean) => {
  setEdges((eds) =>
    eds.map((edge) =>
      edge.source === sourceId
        ? { 
            ...edge, 
            animated,
            style: { 
              ...edge.style, 
              stroke: animated ? '#c26a2d' : '#10b981',
            }
          }
        : edge
    )
  );
}, [setEdges]);
```

The main execution function walks through nodes:

```tsx
const executeWorkflow = useCallback(async () => {
  setIsExecuting(true);
  setWorkflowStatus('running');

  const executionOrder = ['1', '2', '3', '4', '5', '6'];

  for (const nodeId of executionOrder) {
    // Set node to running
    updateNodeStatus(nodeId, 'running');
    updateEdgeAnimation(nodeId, true);

    // Wait for execution (simulated)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set node to completed
    updateNodeStatus(nodeId, 'completed');
    updateEdgeAnimation(nodeId, false);
  }

  setWorkflowStatus('completed');
  setIsExecuting(false);
}, [updateNodeStatus, updateEdgeAnimation]);
```

## Step 7: Style the Custom Nodes

Use CSS to create status-based visual feedback:

```css
.workflow-node {
  width: 260px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
}

/* Status-based borders */
.workflow-node.status-running {
  box-shadow: 0 0 0 2px #c26a2d;
}

.workflow-node.status-completed {
  box-shadow: 0 0 0 2px #10b981;
}

.workflow-node.status-error {
  box-shadow: 0 0 0 2px #ef4444;
}

/* Status indicator badge */
.node-status-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.node-status-indicator.status-running,
.node-status-indicator.status-completed {
  opacity: 1;
  transform: scale(1);
}

/* Custom handle styling */
.workflow-handle {
  width: 12px !important;
  height: 12px !important;
  background: #64748b !important;
  border: 2px solid #fff !important;
}
```

## Step 8: Add Error Handling

Simulate failures to demonstrate error states:

```tsx
const simulateError = useCallback(async () => {
  resetWorkflow();
  setIsExecuting(true);
  setWorkflowStatus('running');

  // Execute first two nodes successfully
  for (let i = 0; i < 2; i++) {
    updateNodeStatus(executionOrder[i], 'running');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateNodeStatus(executionOrder[i], 'completed');
  }

  // Fail on third node
  updateNodeStatus(executionOrder[2], 'running');
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateNodeStatus(executionOrder[2], 'error');

  // Update edge to error color
  setEdges((eds) =>
    eds.map((edge) =>
      edge.source === executionOrder[2]
        ? { ...edge, style: { ...edge.style, stroke: '#ef4444' } }
        : edge
    )
  );

  setWorkflowStatus('error');
  setIsExecuting(false);
}, [resetWorkflow, updateNodeStatus, setEdges]);
```

WARNING: In production, implement retry logic and proper error recovery rather than just stopping execution.

## React Flow Features Used

| Feature | Description |
|---------|-------------|
| `ReactFlow` | Main container component |
| `useNodesState` | Hook for managing node state with built-in handlers |
| `useEdgesState` | Hook for managing edge state with built-in handlers |
| `Handle` | Connection points for edges |
| `Background` | Customizable grid/dot background |
| `Controls` | Zoom and pan controls |
| `MiniMap` | Overview navigation panel |
| `fitView` | Auto-fit all nodes in viewport |

## Advanced: Branching Logic

React Flow supports multiple edges from a single node for branching:

```tsx
const edges = [
  { 
    id: 'branch-yes', 
    source: 'condition-node', 
    target: 'yes-path',
    label: 'Yes',
    sourceHandle: 'yes',  // Multiple handles per node
  },
  { 
    id: 'branch-no', 
    source: 'condition-node', 
    target: 'no-path',
    label: 'No',
    sourceHandle: 'no',
  },
];

// In the custom node component:
<Handle type="source" position={Position.Right} id="yes" style={{ top: '30%' }} />
<Handle type="source" position={Position.Right} id="no" style={{ top: '70%' }} />
```

## Performance Tips

1. **Memoize node types** - Define `nodeTypes` outside the component or use `useMemo`
2. **Use `fitView` wisely** - Only on initial render, not on every state change
3. **Batch state updates** - Update multiple nodes in a single `setNodes` call
4. **Virtualization** - React Flow automatically virtualizes nodes off-screen

```tsx
// Good: nodeTypes defined outside component
const nodeTypes = { workflow: WorkflowNode };

// Or with useMemo inside component
const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);
```

## Comparison: Custom Implementation vs React Flow

| Feature | Custom Grid | React Flow |
|---------|-------------|------------|
| Drag & Drop | Manual implementation | Built-in |
| Zoom & Pan | Manual implementation | Built-in |
| Edge Routing | Complex SVG math | Automatic |
| Selection | Manual state | Built-in |
| Undo/Redo | Manual history | Available plugin |
| Virtualization | Add separately | Built-in |
| Touch Support | Manual events | Built-in |

## Conclusion

React Flow provides a powerful foundation for building workflow visualizations. By creating custom node components and leveraging React Flow's state management hooks, you can build professional-grade workflow builders with minimal boilerplate. The library handles complex interactions like drag-and-drop, zoom, pan, and edge routing automatically.

---

## Related Tutorials

- [Building a Data Grid with FluentUI](/blog/fluentui-dynamic-datagrid)
- [Creating Animated Counters](/blog/animated-counters)
- [Magnetic Button Effects](/blog/magnetic-button-effect)
