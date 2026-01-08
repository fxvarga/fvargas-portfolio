/**
 * Policy content viewer with approval matrix visualization
 */

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PolicyContent, ApprovalLevel } from '@/types/knowledge';
import { 
  Shield, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  FileText,
  ArrowRight
} from 'lucide-react';

interface PolicyContentViewerProps {
  content: PolicyContent;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ApprovalMatrixRow({ level, index }: { level: ApprovalLevel; index: number }) {
  const hasRange = level.min !== undefined || level.max !== undefined;
  const hasThreshold = level.threshold !== undefined;
  
  let amountDisplay = 'Any amount';
  if (hasThreshold) {
    amountDisplay = `> ${formatCurrency(level.threshold!)}`;
  } else if (hasRange) {
    if (level.min !== undefined && level.max !== undefined) {
      amountDisplay = `${formatCurrency(level.min)} - ${formatCurrency(level.max)}`;
    } else if (level.min !== undefined) {
      amountDisplay = `> ${formatCurrency(level.min)}`;
    } else if (level.max !== undefined) {
      amountDisplay = `< ${formatCurrency(level.max)}`;
    }
  }

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-lg transition-colors
      ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/60'}
      hover:bg-gray-800/80
    `}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-gray-200 font-medium">{amountDisplay}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <span className="text-gray-300 capitalize">{level.approver.replace(/_/g, ' ')}</span>
        </div>
        {level.description && (
          <p className="text-sm text-gray-500">{level.description}</p>
        )}
      </div>
    </div>
  );
}

export function PolicyContentViewer({ content }: PolicyContentViewerProps) {
  const approvalLevels = content.approval_matrix || content.approval_levels || [];
  const hasApprovalMatrix = approvalLevels.length > 0;

  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <User className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 capitalize">
                  {content.owner?.replace(/_/g, ' ') || 'Not specified'}
                </p>
                <p className="text-xs text-gray-500">Policy Owner</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">
                  {content.effective_date || 'Not specified'}
                </p>
                <p className="text-xs text-gray-500">Effective Date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 capitalize">
                  {content.category || 'General'}
                </p>
                <p className="text-xs text-gray-500">Category</p>
              </div>
            </div>
            {content.version && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">v{content.version}</p>
                  <p className="text-xs text-gray-500">Version</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Matrix */}
      {hasApprovalMatrix && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300">Approval Matrix</h3>
            </div>
            
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-700 mb-2">
              <span>Amount Threshold</span>
              <span>Required Approver</span>
              <span>Notes</span>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {approvalLevels.map((level, idx) => (
                <ApprovalMatrixRow key={idx} level={level} index={idx} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thresholds */}
      {content.thresholds && Object.keys(content.thresholds).length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Policy Thresholds</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(content.thresholds).map(([key, value]) => (
                <div 
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-green-400">
                    {typeof value === 'number' ? formatCurrency(value) : value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Useful Lives */}
      {content.useful_lives && Object.keys(content.useful_lives).length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Useful Lives (Years)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(content.useful_lives).map(([assetType, years]) => (
                <div 
                  key={assetType}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <span className="text-gray-300 capitalize">{assetType.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-blue-400">{years} yrs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules */}
      {content.rules && content.rules.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Policy Rules</h3>
            <div className="space-y-2">
              {content.rules.map((rule, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-200">{rule.name}</p>
                    <p className="text-sm text-gray-400">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Procedures */}
      {content.related_procedures && content.related_procedures.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Related Procedures</h3>
            <div className="flex flex-wrap gap-2">
              {content.related_procedures.map(proc => (
                <Badge key={proc.id} variant="info">
                  {proc.id}: {proc.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON fallback */}
      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Full Policy Content</h3>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300 max-h-[400px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
