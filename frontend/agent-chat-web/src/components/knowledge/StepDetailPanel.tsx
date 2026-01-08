/**
 * Step detail panel - shows full details when a step is selected
 */

import type { ProcedureStep } from '@/types/knowledge';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  X, 
  ShieldCheck, 
  Wrench, 
  ArrowRight, 
  GitBranch,
  DollarSign
} from 'lucide-react';

interface StepDetailPanelProps {
  step: ProcedureStep;
  onClose: () => void;
}

export function StepDetailPanel({ step, onClose }: StepDetailPanelProps) {
  const stepNumber = step.sequence || step.step_number || 0;

  return (
    <Card className="absolute right-4 top-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto z-10 shadow-2xl border-gray-600">
      <CardContent className="py-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold">
              {stepNumber}
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 capitalize">
                {step.action.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-gray-500">Step {stepNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label="Close details"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>
        </div>

        {/* Tool Hint */}
        {step.tool_hint && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              Tool
            </h4>
            <code className="text-sm font-mono text-purple-400 bg-gray-800 px-2 py-1 rounded">
              {step.tool_hint}
            </code>
          </div>
        )}

        {/* Output Variable */}
        {(step.output || step.output_variable) && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Output Variable
            </h4>
            <code className="text-sm font-mono text-cyan-400 bg-gray-800 px-2 py-1 rounded">
              {step.output || step.output_variable}
            </code>
          </div>
        )}

        {/* Condition */}
        {step.condition && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              Condition
            </h4>
            <code className="text-xs font-mono text-orange-400 bg-gray-800 px-2 py-1 rounded block whitespace-pre-wrap">
              {step.condition}
            </code>
          </div>
        )}

        {/* Approval */}
        {step.requires_approval && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Requires Approval</span>
            </div>
            {step.approval_threshold && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <DollarSign className="w-3 h-3" />
                Threshold: ${step.approval_threshold.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Parameters */}
        {step.parameters && Object.keys(step.parameters).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Parameters</h4>
            <div className="bg-gray-800 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(step.parameters, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
          <Badge variant="info">{step.action}</Badge>
          {step.requires_approval && <Badge variant="warning">Approval</Badge>}
          {step.condition && <Badge variant="default">Conditional</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
