/**
 * Custom node component for procedure steps in React Flow
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { ProcedureStep } from '@/types/knowledge';
import { 
  Database, 
  CheckCircle, 
  Calculator, 
  FileText, 
  GitBranch,
  Layers,
  Bell,
  RefreshCw,
  ShieldCheck,
  Wrench
} from 'lucide-react';

export interface StepNodeData extends Record<string, unknown> {
  step: ProcedureStep;
  isSelected: boolean;
  onSelect: (step: ProcedureStep) => void;
}

export type StepNodeType = Node<StepNodeData, 'step'>;

const actionIcons: Record<string, React.ReactNode> = {
  retrieve_data: <Database className="w-4 h-4" />,
  validate: <CheckCircle className="w-4 h-4" />,
  calculate: <Calculator className="w-4 h-4" />,
  create_journal_entry: <FileText className="w-4 h-4" />,
  conditional: <GitBranch className="w-4 h-4" />,
  aggregate: <Layers className="w-4 h-4" />,
  transform: <RefreshCw className="w-4 h-4" />,
  filter: <Layers className="w-4 h-4" />,
  reconcile: <CheckCircle className="w-4 h-4" />,
  create_reconciliation: <FileText className="w-4 h-4" />,
  update_close_task: <CheckCircle className="w-4 h-4" />,
  notification_send: <Bell className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  retrieve_data: 'border-blue-500/50 bg-blue-500/10',
  validate: 'border-green-500/50 bg-green-500/10',
  calculate: 'border-purple-500/50 bg-purple-500/10',
  create_journal_entry: 'border-amber-500/50 bg-amber-500/10',
  conditional: 'border-orange-500/50 bg-orange-500/10',
  aggregate: 'border-cyan-500/50 bg-cyan-500/10',
  transform: 'border-indigo-500/50 bg-indigo-500/10',
  filter: 'border-teal-500/50 bg-teal-500/10',
  reconcile: 'border-emerald-500/50 bg-emerald-500/10',
  create_reconciliation: 'border-lime-500/50 bg-lime-500/10',
  update_close_task: 'border-green-500/50 bg-green-500/10',
  notification_send: 'border-pink-500/50 bg-pink-500/10',
};

function StepNodeComponent({ data }: NodeProps<StepNodeType>) {
  const { step, isSelected, onSelect } = data;
  const stepNumber = step.sequence || step.step_number || 0;
  const icon = actionIcons[step.action] || <Wrench className="w-4 h-4" />;
  const colorClass = actionColors[step.action] || 'border-gray-500/50 bg-gray-500/10';
  
  // Truncate description to ~60 chars
  const truncatedDesc = step.description.length > 60 
    ? step.description.substring(0, 57) + '...' 
    : step.description;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      
      <div 
        className={`
          w-72 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
          ${colorClass}
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''}
          hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
        `}
        onClick={() => onSelect(step)}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-bold text-gray-300">
            {stepNumber}
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            {icon}
            <span className="font-semibold text-sm capitalize">
              {step.action.replace(/_/g, ' ')}
            </span>
          </div>
          {step.requires_approval && (
            <span className="ml-auto" aria-label="Requires approval">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-2">
          {truncatedDesc}
        </p>

        {/* Footer badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {step.tool_hint && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-800/80 text-gray-400 border border-gray-700/50">
              {step.tool_hint}
            </span>
          )}
          {step.output && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800/80 text-cyan-400 border border-cyan-700/50">
              → {step.output}
            </span>
          )}
          {step.output_variable && !step.output && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800/80 text-cyan-400 border border-cyan-700/50">
              → {step.output_variable}
            </span>
          )}
        </div>

        {/* Condition indicator */}
        {step.condition && (
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <span className="text-xs text-orange-400">
              Condition: {step.condition.length > 40 ? step.condition.substring(0, 37) + '...' : step.condition}
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
    </>
  );
}

export const StepNode = memo(StepNodeComponent);
