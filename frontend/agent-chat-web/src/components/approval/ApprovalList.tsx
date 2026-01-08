import { ApprovalCard } from './ApprovalCard';
import type { ApprovalDto, ApprovalDecision } from '@/types';

interface ApprovalListProps {
  approvals: ApprovalDto[];
  onResolve: (
    approvalId: string,
    decision: ApprovalDecision,
    editedArguments?: string,
    reason?: string,
  ) => void;
  resolvingIds?: Set<string>;
}

export function ApprovalList({
  approvals,
  onResolve,
  resolvingIds = new Set(),
}: ApprovalListProps) {
  if (approvals.length === 0) {
    return null;
  }

  return (
    <div className="p-4 space-y-4 border-t border-gray-700 bg-gray-800/30">
      <h3 className="text-sm font-medium text-gray-400">
        Pending Approvals ({approvals.length})
      </h3>
      {approvals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          onResolve={onResolve}
          isResolving={resolvingIds.has(approval.id)}
        />
      ))}
    </div>
  );
}
