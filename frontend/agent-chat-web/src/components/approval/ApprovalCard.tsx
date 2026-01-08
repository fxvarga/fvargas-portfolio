import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskBadge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { formatJson } from '@/lib/utils';
import type { ApprovalDto, ApprovalDecision } from '@/types';
import { Shield, Check, X, Edit, FileCode } from 'lucide-react';

interface ApprovalCardProps {
  approval: ApprovalDto;
  onResolve: (
    approvalId: string,
    decision: ApprovalDecision,
    editedArguments?: string,
    reason?: string,
  ) => void;
  isResolving?: boolean;
}

export function ApprovalCard({
  approval,
  onResolve,
  isResolving = false,
}: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArgs, setEditedArgs] = useState(
    formatJson(approval.originalArgs),
  );
  const [reason, setReason] = useState('');

  const handleApprove = () => {
    onResolve(approval.id, 'Approved' as ApprovalDecision);
  };

  const handleReject = () => {
    onResolve(approval.id, 'Rejected' as ApprovalDecision, undefined, reason);
  };

  const handleApproveWithEdits = () => {
    onResolve(
      approval.id,
      'EditedAndApproved' as ApprovalDecision,
      editedArgs,
      reason,
    );
  };

  return (
    <Card className="border-amber-600/30 bg-amber-950/10 shadow-lg shadow-amber-900/10">
      <CardHeader className="border-amber-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-semibold text-amber-300">
              Approval Required
            </span>
          </div>
          <RiskBadge riskTier={approval.riskTier} showIcon />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-200">
              Tool: <span className="font-mono text-amber-300">{approval.toolName}</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            This tool requires approval before execution due to its{' '}
            <span className="text-amber-400 font-medium">{approval.riskTier.toLowerCase()} risk</span> level.
            Please review the arguments below.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            Arguments
          </label>
          {isEditing ? (
            <Textarea
              value={editedArgs}
              onChange={(e) => setEditedArgs(e.target.value)}
              rows={6}
              className="font-mono text-xs"
              aria-label="Edit tool arguments"
            />
          ) : (
            <pre className="p-4 bg-gray-900/80 rounded-xl text-xs text-gray-300 overflow-x-auto border border-gray-800 font-mono max-h-48">
              {formatJson(approval.originalArgs)}
            </pre>
          )}
        </div>

        {(isEditing || reason) && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Reason (optional)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your decision..."
              rows={2}
              aria-label="Reason for decision"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="border-amber-600/20">
        <div className="flex items-center gap-3 w-full">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isResolving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApproveWithEdits}
                isLoading={isResolving}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve with Edits
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                disabled={isResolving}
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isResolving}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                isLoading={isResolving}
                className="ml-auto"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
