# Building AI Tool Call Cards with React

Create expandable cards that visualize AI agent tool executions — showing input parameters, output results, status indicators, and execution timing. Essential for building transparent AI agent interfaces that let users understand what's happening behind the scenes.

## What We're Building

Our AI tool call card system includes:

- **Four status states** — pending, running, success, and error with distinct visuals
- **Expandable panels** with smooth height animation for input/output details
- **Animated execution simulation** to demonstrate live status transitions
- **Duration tracking** for completed operations
- **Monospace code formatting** for JSON input and output display

TIP: Click "Simulate Execution" to watch all five tool calls animate through their states. Click any card header to expand and see the input/output details!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Understanding of React hooks (useState, useCallback, useRef, useEffect)
- Familiarity with CSS transitions and `max-height` animation techniques

## Step 1: Define the Tool Call Data Model

First, let's define our TypeScript types for tool call data:

```tsx
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
```

Each tool call has a lifecycle: pending → running → success/error. The `input` is always present (it's what the AI decided to pass), while `output`, `error`, and `duration` appear as the call progresses.

## Step 2: Build the Expandable Card Component

The card header acts as a button that toggles the expandable body. We use `max-height` transitions for smooth animation:

```tsx
const ToolCallCard: React.FC<{ tool: ToolCallData }> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, tool.status, tool.output]);

  return (
    <div className={`tool-call-card tool-status-${tool.status}`}>
      <button
        className="tool-call-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {/* Header content */}
      </button>

      <div
        className={`tool-call-body ${isExpanded ? 'expanded' : ''}`}
        style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef}>
          {/* Expandable content */}
        </div>
      </div>
    </div>
  );
};
```

NOTE: We measure `scrollHeight` dynamically because the content size changes when output appears. This is more reliable than using a fixed max-height value.

## Step 3: Add Status Indicators

Each status gets a distinct icon, color, and badge. The running state includes a pulse animation:

```tsx
const statusIcons: Record<ToolStatus, string> = {
  pending: '⏳',
  running: '⚡',
  success: '✓',
  error: '✕',
};

<span className={`status-icon status-${tool.status}`}>
  {statusIcons[tool.status]}
</span>

<span className={`tool-status-badge badge-${tool.status}`}>
  {statusLabels[tool.status]}
</span>
```

```css
.status-icon.status-running {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  animation: statusPulse 1.5s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

## Step 4: Create Input/Output Panels

Each tool call displays its JSON input and text output in formatted code panels:

```tsx
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
```

## Step 5: Animate Sequential Execution

The simulation function walks through each tool call, setting them to "running" then to their final state with staggered timeouts:

```tsx
const simulateExecution = useCallback(() => {
  // Reset all to pending
  const pendingTools = tools.map(t => ({
    ...t,
    status: 'pending' as ToolStatus,
    output: undefined,
    error: undefined,
    duration: undefined,
  }));
  setToolCalls(pendingTools);

  // Animate each sequentially
  tools.forEach((tool, index) => {
    setTimeout(() => {
      setToolCalls(prev =>
        prev.map((t, i) => (i === index ? { ...t, status: 'running' } : t))
      );
    }, index * 1200 + 400);

    setTimeout(() => {
      setToolCalls(prev =>
        prev.map((t, i) => (i === index ? { ...originalTools[i] } : t))
      );
    }, index * 1200 + 1200);
  });
}, []);
```

## Styling

The card uses border-color changes to indicate status, with a subtle glow for running state:

```css
.tool-call-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.tool-call-card.tool-status-running {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.1);
}

.tool-call-card.tool-status-success {
  border-color: rgba(34, 197, 94, 0.2);
}

.tool-call-card.tool-status-error {
  border-color: rgba(239, 68, 68, 0.2);
}

/* Smooth expand animation */
.tool-call-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
```

## Usage Examples

```tsx
// Single tool call card
<ToolCallCard
  tool={{
    id: '1',
    toolName: 'web_search',
    description: 'Search for React tutorials',
    status: 'success',
    input: { query: 'React hooks tutorial' },
    output: 'Found 10 results...',
    duration: 245,
  }}
/>

// List of tool calls from an AI agent
<div className="tool-calls-list">
  {agent.toolCalls.map(tool => (
    <ToolCallCard key={tool.id} tool={tool} />
  ))}
</div>
```

## Performance Considerations

WARNING: Avoid re-measuring `scrollHeight` on every render. Only recalculate when the content actually changes (status updates or new output data).

- Use `useRef` for content height measurement to avoid layout thrashing
- Batch state updates when simulating sequential execution
- Consider virtualization for agents that make many (50+) tool calls

## Accessibility

```tsx
// Card acts as a disclosure widget
<div role="region" aria-label={`Tool call: ${tool.toolName}`}>
  <button
    className="tool-call-header"
    aria-expanded={isExpanded}
    onClick={() => setIsExpanded(!isExpanded)}
  >
    {/* header content */}
  </button>
</div>
```

- **Keyboard navigable** — headers are `<button>` elements, focusable with Tab and toggled with Enter/Space
- **ARIA expanded** state communicates collapse/expand to screen readers
- **Reduced motion** support disables all transitions and animations

## Conclusion

Tool call cards provide transparency into AI agent behavior, building user trust and aiding debugging. The expandable design keeps the interface clean while making detailed input/output available on demand. Customize the tool types and status colors to match your agent framework.

---

## Related Tutorials

- [Building an AI Chat Bubble Component](/blog/ai-chat-bubble)
- [Building an AI Approval Flow Interface](/blog/ai-approval-flow)
- [Creating AI Thinking Skeleton Loaders](/blog/ai-thinking-skeleton)
