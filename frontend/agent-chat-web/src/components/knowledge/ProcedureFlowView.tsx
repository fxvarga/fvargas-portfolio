/**
 * React Flow visualization for procedure steps
 */

import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { ProcedureContent, ProcedureStep } from '@/types/knowledge';
import { StepNode, type StepNodeType, type StepNodeData } from './nodes/StepNode';
import { StepDetailPanel } from './StepDetailPanel';

interface ProcedureFlowViewProps {
  procedure: ProcedureContent;
}

const nodeTypes: NodeTypes = {
  step: StepNode,
};

// Dark theme for React Flow
const proOptions = { hideAttribution: true };

export function ProcedureFlowView({ procedure }: ProcedureFlowViewProps) {
  const [selectedStep, setSelectedStep] = useState<ProcedureStep | null>(null);

  const handleSelectStep = useCallback((step: ProcedureStep) => {
    setSelectedStep(prev => prev?.sequence === step.sequence ? null : step);
  }, []);

  // Generate nodes and edges from procedure steps
  const { initialNodes, initialEdges } = useMemo(() => {
    const steps = procedure.steps || [];
    const nodes: StepNodeType[] = [];
    const edges: Edge[] = [];

    const NODE_HEIGHT = 140;
    const NODE_GAP = 40;

    steps.forEach((step, index) => {
      const stepNumber = step.sequence || step.step_number || index + 1;
      
      const nodeData: StepNodeData = {
        step,
        isSelected: selectedStep?.sequence === step.sequence,
        onSelect: handleSelectStep,
      };
      
      nodes.push({
        id: `step-${stepNumber}`,
        type: 'step',
        position: { x: 0, y: index * (NODE_HEIGHT + NODE_GAP) },
        data: nodeData,
      });

      // Add edge to next step
      if (index < steps.length - 1) {
        const nextStep = steps[index + 1];
        const nextStepNumber = nextStep.sequence || nextStep.step_number || index + 2;
        
        edges.push({
          id: `edge-${stepNumber}-${nextStepNumber}`,
          source: `step-${stepNumber}`,
          target: `step-${nextStepNumber}`,
          type: 'smoothstep',
          animated: step.condition ? true : false,
          style: { 
            stroke: step.condition ? '#f97316' : '#6b7280',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: step.condition ? '#f97316' : '#6b7280',
          },
          label: step.condition ? 'conditional' : undefined,
          labelStyle: { fill: '#f97316', fontSize: 10 },
          labelBgStyle: { fill: '#1f2937', fillOpacity: 0.8 },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [procedure.steps, selectedStep, handleSelectStep]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when selection changes
  useMemo(() => {
    setNodes(currentNodes => currentNodes.map(node => {
      const nodeData = node.data as StepNodeData;
      return {
        ...node,
        data: {
          ...nodeData,
          isSelected: selectedStep?.sequence === nodeData.step.sequence || 
                      selectedStep?.step_number === nodeData.step.step_number,
          onSelect: handleSelectStep,
        },
      };
    }));
  }, [selectedStep, handleSelectStep, setNodes]);

  return (
    <div className="relative w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 150, y: 20, zoom: 0.8 }}
        className="bg-gray-900"
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls 
          className="!bg-gray-800 !border-gray-700 !shadow-lg"
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-gray-800 !border-gray-700"
          nodeColor="#4b5563"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      {/* Step detail panel */}
      {selectedStep && (
        <StepDetailPanel 
          step={selectedStep} 
          onClose={() => setSelectedStep(null)} 
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-gray-500 bg-gray-800/90 px-3 py-2 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-gray-500" />
          <span>Sequential</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500" />
          <span>Conditional</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <span>Approval</span>
        </div>
      </div>
    </div>
  );
}
