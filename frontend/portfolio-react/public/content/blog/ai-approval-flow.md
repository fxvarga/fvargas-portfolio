# Building an AI Approval Flow with React

As AI agents become more autonomous, the human-in-the-loop pattern becomes critical for safety. This tutorial builds a complete approval flow interface where AI proposes actions and humans can approve, reject, or modify them before execution — perfect for dashboards, admin panels, and agentic AI applications.

## What We're Building

Our AI approval flow component includes:

- **Risk-level badges** with color-coded severity (low, medium, high, critical)
- **AI reasoning display** showing why each action was proposed
- **Expandable detail panels** with key-value metadata
- **Three response options** — approve, modify & approve, reject
- **Summary bar** with real-time counts and bulk approve
- **Animated status transitions** with overlay feedback
- **Zero external dependencies** — pure React and CSS

TIP: Try the demo above! Click "Show Details" on any card to see the metadata, then approve, modify, or reject each action. Watch the summary bar update in real time.

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of TypeScript interfaces
- Familiarity with React hooks (useState, useCallback)

## Step 1: Define the Data Model

The foundation of any approval flow is a well-typed data model. We need to represent risk levels, action statuses, and the full shape of a proposed action:

```tsx
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ActionStatus = 'pending' | 'approved' | 'rejected' | 'modified';

interface ProposedAction {
  id: string;
  title: string;
  description: string;
  risk: RiskLevel;
  category: string;
  details: Record<string, string>;
  reasoning: string;
  status: ActionStatus;
  modifiedNote?: string;
}
```

The `risk` field drives visual styling — each level gets distinct colors so reviewers can quickly identify high-priority items. The `modifiedNote` is optional, populated only when a reviewer modifies an action before approving.

## Step 2: Build the Risk Badge

A small but important subcomponent — the risk badge provides instant visual classification:

```tsx
interface RiskBadgeProps {
  risk: RiskLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
  const labels: Record<RiskLevel, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical',
  };

  return (
    <span className={`risk-badge risk-${risk}`}>
      {labels[risk]}
    </span>
  );
};
```

The CSS uses distinct background/text color pairs for each level:

```css
.risk-low {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.risk-high {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.risk-critical {
  background: rgba(168, 34, 239, 0.15);
  color: #c084fc;
}
```

## Step 3: Build the Approval Card

Each proposed action renders as a card with multiple sections — header, reasoning, details, and action buttons:

```tsx
interface ApprovalCardProps {
  action: ProposedAction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onModify: (id: string, note: string) => void;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({
  action,
  onApprove,
  onReject,
  onModify,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [modifyNote, setModifyNote] = useState('');

  const isResolved = action.status !== 'pending';

  return (
    <div
      className={`approval-card status-${action.status}`}
      role="article"
      aria-label={`Proposed action: ${action.title}`}
    >
      {/* Status overlay for resolved items */}
      {isResolved && (
        <div className={`status-overlay overlay-${action.status}`}>
          <span className="status-overlay-icon">
            {action.status === 'approved' ? '✓' : action.status === 'rejected' ? '✕' : '✎'}
          </span>
          <span className="status-overlay-label">
            {action.status === 'approved' && 'Approved'}
            {action.status === 'rejected' && 'Rejected'}
            {action.status === 'modified' && 'Modified & Approved'}
          </span>
        </div>
      )}

      {/* Card content sections... */}
    </div>
  );
};
```

NOTE: The resolved overlay uses `position: absolute` to cover the entire card, creating a clear visual distinction between pending and resolved items without removing them from the list.

## Step 4: Add the AI Reasoning Section

Transparency is essential for trust. Each card displays the AI's reasoning so reviewers understand why an action was proposed:

```tsx
<div className="approval-reasoning">
  <div className="reasoning-label">
    <span className="reasoning-icon">🤖</span>
    AI Reasoning
  </div>
  <p className="reasoning-text">{action.reasoning}</p>
</div>
```

The reasoning section uses a subtle accent border to visually connect it to the AI system:

```css
.approval-reasoning {
  padding: 0.75rem;
  background: rgba(194, 106, 45, 0.06);
  border: 1px solid rgba(194, 106, 45, 0.15);
  border-radius: 6px;
}
```

## Step 5: Implement the Modify Flow

The "modify" option is the most complex interaction — it lets reviewers adjust an action before approving it:

```tsx
const handleModifySubmit = () => {
  if (modifyNote.trim()) {
    onModify(action.id, modifyNote.trim());
    setShowModify(false);
    setModifyNote('');
  }
};

// In the render:
{showModify && !isResolved && (
  <div className="modify-input-area">
    <textarea
      className="modify-textarea"
      value={modifyNote}
      onChange={(e) => setModifyNote(e.target.value)}
      placeholder="Describe the modification before approving..."
      rows={2}
    />
    <div className="modify-actions">
      <button
        className="modify-submit-btn"
        onClick={handleModifySubmit}
        disabled={!modifyNote.trim()}
      >
        Submit Modification
      </button>
      <button
        className="modify-cancel-btn"
        onClick={() => {
          setShowModify(false);
          setModifyNote('');
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

This pattern gives reviewers nuanced control — they can approve the spirit of an action while adjusting the specifics.

## Step 6: Build the Summary Bar

The summary bar provides an at-a-glance overview and bulk actions:

```tsx
const pendingCount = actions.filter((a) => a.status === 'pending').length;
const approvedCount = actions.filter(
  (a) => a.status === 'approved' || a.status === 'modified'
).length;
const rejectedCount = actions.filter((a) => a.status === 'rejected').length;

return (
  <div className="approval-summary">
    <div className="summary-stat">
      <span className="summary-count pending-count">{pendingCount}</span>
      <span className="summary-label">Pending</span>
    </div>
    <div className="summary-stat">
      <span className="summary-count approved-count">{approvedCount}</span>
      <span className="summary-label">Approved</span>
    </div>
    <div className="summary-stat">
      <span className="summary-count rejected-count">{rejectedCount}</span>
      <span className="summary-label">Rejected</span>
    </div>
    <div className="summary-actions">
      <button
        className="summary-btn approve-all-btn"
        onClick={handleApproveAll}
        disabled={pendingCount === 0}
      >
        Approve All ({pendingCount})
      </button>
      <button className="summary-btn reset-btn" onClick={handleReset}>
        Reset
      </button>
    </div>
  </div>
);
```

## Step 7: Wire Up State Management

The parent component manages the list of actions and provides callbacks for status updates:

```tsx
const AiApprovalFlowDemo: React.FC<DemoProps> = ({ className }) => {
  const [actions, setActions] = useState<ProposedAction[]>(initialActions);

  const handleApprove = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'approved' as ActionStatus } : a
      )
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as ActionStatus } : a
      )
    );
  }, []);

  const handleModify = useCallback((id: string, note: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'modified' as ActionStatus, modifiedNote: note }
          : a
      )
    );
  }, []);

  const handleApproveAll = useCallback(() => {
    setActions((prev) =>
      prev.map((a) =>
        a.status === 'pending'
          ? { ...a, status: 'approved' as ActionStatus }
          : a
      )
    );
  }, []);
};
```

NOTE: We use `useCallback` for all handlers to prevent unnecessary re-renders. Since each card is a separate component, stable callback references ensure React can skip re-rendering cards that didn't change.

## Styling

The complete CSS follows the dark theme pattern with distinct colors for each state:

```css
.approval-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s ease;
}

.approval-card.status-approved {
  border-color: rgba(34, 197, 94, 0.2);
}

.approval-card.status-rejected {
  border-color: rgba(239, 68, 68, 0.2);
}

.status-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 2;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Usage Examples

```tsx
// Basic usage with static data
<ApprovalCard
  action={proposedAction}
  onApprove={handleApprove}
  onReject={handleReject}
  onModify={handleModify}
/>

// Full approval flow with API integration
const ApprovalDashboard = () => {
  const [actions, setActions] = useState<ProposedAction[]>([]);

  useEffect(() => {
    fetchPendingActions().then(setActions);
  }, []);

  const handleApprove = async (id: string) => {
    await api.approveAction(id);
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'approved' } : a
      )
    );
  };

  return (
    <div>
      {actions.map((action) => (
        <ApprovalCard
          key={action.id}
          action={action}
          onApprove={handleApprove}
          onReject={handleReject}
          onModify={handleModify}
        />
      ))}
    </div>
  );
};

// With WebSocket for real-time updates
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/approvals');
  ws.onmessage = (event) => {
    const newAction = JSON.parse(event.data);
    setActions((prev) => [...prev, newAction]);
  };
  return () => ws.close();
}, []);
```

## Performance Considerations

WARNING: If rendering hundreds of approval cards, consider virtualizing the list with `react-window` or paginating results. Each card contains expandable sections and interactive controls that add to the DOM complexity.

- **Memoize callbacks** with `useCallback` to prevent unnecessary re-renders
- **Lazy-load detail sections** — only render detail content when expanded
- **Batch state updates** — React 18 batches these automatically, but be mindful in async handlers
- **Debounce bulk operations** if they trigger API calls

## Accessibility

The approval flow includes several accessibility features:

```tsx
// Semantic roles and labels
<div role="article" aria-label={`Proposed action: ${action.title}`}>
  <button aria-expanded={showDetails}>
    Show Details
  </button>
</div>
```

Key accessibility considerations:

- Each card uses `role="article"` with a descriptive `aria-label`
- Toggle buttons include `aria-expanded` state
- Action buttons have clear, descriptive text (not just icons)
- Color is never the only indicator — text labels accompany all status colors
- Reduced motion support removes all animations and transitions:

```css
@media (prefers-reduced-motion: reduce) {
  .approval-card,
  .action-btn,
  .status-overlay,
  .approval-details {
    transition: none !important;
    animation: none !important;
  }
}
```

## Extending the Pattern

This approval flow can be extended for production use cases:

- **Audit trail** — Log all approve/reject/modify actions with timestamps
- **Role-based access** — Only show actions matching the reviewer's permissions
- **Expiration timers** — Auto-reject actions that aren't reviewed within a deadline
- **Undo support** — Allow reversing a decision within a grace period
- **Comments thread** — Enable discussion between reviewers before deciding

## Conclusion

The human-in-the-loop approval pattern is essential for building trustworthy AI systems. By combining clear risk visualization, AI reasoning transparency, and flexible response options, we create an interface that keeps humans in control while benefiting from AI automation.

---

## Related Tutorials

- [Building AI Chat Bubbles with React](/blog/ai-chat-bubble)
- [Building an AI Prompt Input with React](/blog/ai-prompt-input)
- [Building AI Thinking Skeletons with React](/blog/ai-thinking-skeleton)
- [Building AI Tool Call Cards with React](/blog/ai-tool-call-card)
