/**
 * Procedure content viewer with toggle between Flow and JSON views
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ProcedureFlowView } from './ProcedureFlowView';
import { ProcedureJsonView } from './ProcedureJsonView';
import type { ProcedureContent } from '@/types/knowledge';
import { GitBranch, Code, Info, Clock, Target, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ProcedureContentViewerProps {
  content: ProcedureContent;
}

type ViewMode = 'flow' | 'json';

export function ProcedureContentViewer({ content }: ProcedureContentViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('flow');

  const stepCount = content.steps?.length || 0;
  const approvalSteps = content.steps?.filter(s => s.requires_approval).length || 0;
  const conditionalSteps = content.steps?.filter(s => s.condition).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-100">{stepCount}</p>
                <p className="text-xs text-gray-500">Total Steps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-100">{approvalSteps}</p>
                <p className="text-xs text-gray-500">Require Approval</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <GitBranch className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-100">{conditionalSteps}</p>
                <p className="text-xs text-gray-500">Conditional</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-100 capitalize">
                  {content.frequency || content.trigger?.frequency || 'On Demand'}
                </p>
                <p className="text-xs text-gray-500">Frequency</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Standards & Policies */}
      {(content.related_standards?.length || content.related_policies?.length) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6">
              {content.related_standards && content.related_standards.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Standards</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.related_standards.map(std => (
                      <Badge key={std.id} variant="info">
                        {std.id}: {std.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {content.related_policies && content.related_policies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Policies</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.related_policies.map(pol => (
                      <Badge key={pol.id} variant="success">
                        {pol.id}: {pol.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle & Content */}
      <Card>
        <CardContent className="py-4">
          {/* Toggle Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Procedure Workflow
            </h3>
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('flow')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${viewMode === 'flow' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'}
                `}
              >
                <GitBranch className="w-4 h-4" />
                Flow
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${viewMode === 'json' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'}
                `}
              >
                <Code className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'flow' ? (
            <ProcedureFlowView procedure={content} />
          ) : (
            <ProcedureJsonView content={content} />
          )}
        </CardContent>
      </Card>

      {/* Validation Rules */}
      {content.validation_rules && content.validation_rules.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Validation Rules</h3>
            <div className="space-y-2">
              {content.validation_rules.map((rule, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-200">{rule.name.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-400">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts Mapping */}
      {content.accounts_mapping && Object.keys(content.accounts_mapping).length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Account Mappings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(content.accounts_mapping).map(([category, accounts]) => (
                <div key={category} className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 capitalize">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(accounts).map(([assetType, accountCode]) => (
                      <div key={assetType} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{assetType.replace(/_/g, ' ')}</span>
                        <code className="text-purple-400 font-mono">{accountCode}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
