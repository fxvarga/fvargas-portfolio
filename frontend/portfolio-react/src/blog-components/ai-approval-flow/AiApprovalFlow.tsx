/**
 * AI Approval Flow Demo Component
 *
 * Human-in-the-loop approve/reject interface for AI-proposed actions.
 * Shows pending actions with details, risk levels, and interactive
 * approve/reject/edit controls with animated transitions.
 */

import React, { useState, useCallback } from 'react';
import './AiApprovalFlow.css';

// --- Core Types ---

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

// --- Risk Badge ---

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

// --- Approval Card ---

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

  const handleModifySubmit = () => {
    if (modifyNote.trim()) {
      onModify(action.id, modifyNote.trim());
      setShowModify(false);
      setModifyNote('');
    }
  };

  const statusIcons: Record<ActionStatus, string> = {
    pending: '⏱',
    approved: '✓',
    rejected: '✕',
    modified: '✎',
  };

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
          <span className="status-overlay-icon">{statusIcons[action.status]}</span>
          <span className="status-overlay-label">
            {action.status === 'approved' && 'Approved'}
            {action.status === 'rejected' && 'Rejected'}
            {action.status === 'modified' && 'Modified & Approved'}
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className="approval-card-header">
        <div className="approval-card-title-row">
          <span className="approval-category">{action.category}</span>
          <RiskBadge risk={action.risk} />
        </div>
        <h5 className="approval-card-title">{action.title}</h5>
        <p className="approval-card-desc">{action.description}</p>
      </div>

      {/* AI Reasoning */}
      <div className="approval-reasoning">
        <div className="reasoning-label">
          <span className="reasoning-icon">🤖</span>
          AI Reasoning
        </div>
        <p className="reasoning-text">{action.reasoning}</p>
      </div>

      {/* Details Toggle */}
      <button
        className="details-toggle"
        onClick={() => setShowDetails(!showDetails)}
        aria-expanded={showDetails}
      >
        <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        <span className={`toggle-chevron ${showDetails ? 'expanded' : ''}`}>▾</span>
      </button>

      {showDetails && (
        <div className="approval-details">
          {Object.entries(action.details).map(([key, value]) => (
            <div key={key} className="detail-row">
              <span className="detail-key">{key}</span>
              <span className="detail-value">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modified note display */}
      {action.modifiedNote && (
        <div className="modified-note">
          <span className="modified-note-label">Modification:</span>
          <span className="modified-note-text">{action.modifiedNote}</span>
        </div>
      )}

      {/* Modify Input */}
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

      {/* Action Buttons */}
      {!isResolved && (
        <div className="approval-actions">
          <button
            className="action-btn approve-btn"
            onClick={() => onApprove(action.id)}
          >
            <span className="action-btn-icon">✓</span>
            Approve
          </button>
          <button
            className="action-btn modify-btn"
            onClick={() => setShowModify(!showModify)}
          >
            <span className="action-btn-icon">✎</span>
            Modify
          </button>
          <button
            className="action-btn reject-btn"
            onClick={() => onReject(action.id)}
          >
            <span className="action-btn-icon">✕</span>
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

// --- Demo Wrapper ---

interface DemoProps {
  className?: string;
}

const initialActions: ProposedAction[] = [
  {
    id: '1',
    title: 'Deploy updated pricing model',
    description: 'Update the ML pricing model from v2.3 to v3.0 in production, affecting all new price calculations.',
    risk: 'high',
    category: 'Deployment',
    details: {
      'Model Version': 'v2.3 → v3.0',
      'Affected Services': 'pricing-api, checkout-service',
      'Rollback Time': '~5 minutes',
      'A/B Test Results': '12% revenue improvement on test cohort',
    },
    reasoning: 'The v3.0 model showed a 12% revenue improvement in A/B testing over 14 days with 50k users. Error rate remained stable at 0.02%. Recommend deploying during low-traffic window.',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Send re-engagement email campaign',
    description: 'Send personalized emails to 15,420 users who haven\'t logged in for 30+ days.',
    risk: 'medium',
    category: 'Marketing',
    details: {
      'Recipients': '15,420 inactive users',
      'Template': 'win-back-v2 (personalized)',
      'Scheduled': 'Tomorrow 9:00 AM EST',
      'Unsubscribe Rate Est.': '2.1%',
    },
    reasoning: 'Analysis shows users inactive 30-45 days have a 23% win-back rate with personalized emails. The template was tested with a 500-user pilot and achieved 31% open rate.',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Archive stale feature flags',
    description: 'Remove 8 feature flags that have been fully rolled out for 60+ days.',
    risk: 'low',
    category: 'Maintenance',
    details: {
      'Flags to Remove': '8 flags',
      'Oldest Flag': 'enable-new-checkout (142 days)',
      'Code References': '23 files affected',
      'Test Coverage': '100% for affected paths',
    },
    reasoning: 'These flags have been at 100% rollout for over 60 days with no incidents. Removing them reduces configuration complexity and eliminates 23 conditional branches in the codebase.',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Delete production database records',
    description: 'Permanently delete 2.3M orphaned session records older than 90 days from the users database.',
    risk: 'critical',
    category: 'Database',
    details: {
      'Records': '2,341,892 orphaned sessions',
      'Database': 'users-primary (production)',
      'Space Recovery': '~4.2 GB',
      'Backup Available': 'Yes, point-in-time recovery enabled',
    },
    reasoning: 'Orphaned session records are consuming 4.2 GB and degrading query performance by ~15%. Records are older than 90 days with no associated user activity. Backup is available for recovery.',
    status: 'pending',
  },
];

const AiApprovalFlowDemo: React.FC<DemoProps> = ({ className }) => {
  const [actions, setActions] = useState<ProposedAction[]>(initialActions);

  const handleApprove = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as ActionStatus } : a))
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as ActionStatus } : a))
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

  const handleReset = useCallback(() => {
    setActions(initialActions);
  }, []);

  const handleApproveAll = useCallback(() => {
    setActions((prev) =>
      prev.map((a) =>
        a.status === 'pending' ? { ...a, status: 'approved' as ActionStatus } : a
      )
    );
  }, []);

  const pendingCount = actions.filter((a) => a.status === 'pending').length;
  const approvedCount = actions.filter((a) => a.status === 'approved' || a.status === 'modified').length;
  const rejectedCount = actions.filter((a) => a.status === 'rejected').length;

  return (
    <div className={`ai-approval-flow-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>AI Approval Flow</h4>
        <p>Human-in-the-loop interface for reviewing AI-proposed actions</p>
      </div>

      {/* Summary Bar */}
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

      {/* Action Cards */}
      <div className="approval-cards-list">
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

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Risk-level badges (low, medium, high, critical) with color coding</li>
          <li>Expandable detail panels for each proposed action</li>
          <li>Three response options: approve, modify & approve, reject</li>
          <li>AI reasoning display for each proposed action</li>
          <li>Summary bar with real-time counts and bulk approve</li>
          <li>Animated status transitions with overlay feedback</li>
          <li>Accessible with ARIA attributes and keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
};

export default AiApprovalFlowDemo;
