// Enums matching backend - using const objects for erasableSyntaxOnly compatibility
export const RiskTier = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
} as const;
export type RiskTier = (typeof RiskTier)[keyof typeof RiskTier];

export const RunStatus = {
  Pending: 'Pending',
  Running: 'Running',
  WaitingForApproval: 'WaitingForApproval',
  WaitingInput: 'WaitingInput',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export const StepStatus = {
  Pending: 'Pending',
  Running: 'Running',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export const StepType = {
  LlmCall: 'LlmCall',
  ToolCall: 'ToolCall',
  Approval: 'Approval',
} as const;
export type StepType = (typeof StepType)[keyof typeof StepType];

export const ApprovalDecision = {
  Approved: 'Approved',
  Rejected: 'Rejected',
  EditedAndApproved: 'EditedAndApproved',
} as const;
export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export const ApprovalStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// DTOs
export interface MessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCallId?: string;
}

export interface ToolCallDto {
  id: string;
  stepId?: string;
  toolName: string;
  args: unknown; // JsonElement from backend
  result?: unknown; // JsonElement from backend
  error?: string;
  riskTier: RiskTier;
  status: string;
  approvalId?: string;
  startedAt: string; // Timestamp for timeline ordering
  // Computed property on backend
  requiresApproval?: boolean;
}

// Unified chat timeline item for chronological display
export type ChatTimelineItem =
  | { type: 'message'; data: MessageDto; timestamp: string }
  | { type: 'toolCall'; data: ToolCallDto; timestamp: string };

export interface ApprovalDto {
  id: string;
  runId: string;
  stepId?: string;
  toolCallId: string;
  toolName: string;
  originalArgs: unknown; // JsonElement from backend
  riskTier: RiskTier;
  status: ApprovalStatus;
  decision?: ApprovalDecision;
  editedArgs?: unknown; // JsonElement from backend
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface StepDto {
  id: string;
  runId: string;
  sequenceNumber: number;
  type: StepType;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  tokenCount: number;
  toolCallCount: number;
}

export interface RunDto {
  runId: string;
  tenantId: string;
  userId: string;
  status: RunStatus | number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  messages: MessageDto[];
  steps: StepDto[];
  toolCalls: ToolCallDto[];
  approvals: ApprovalDto[];
  hasPendingApproval: boolean;
  lastError?: string;
  totalTokens: number;
}

export interface RunSummary {
  runId: string;
  tenantId: string;
  userId?: string;
  status: RunStatus | string | number;
  createdAt: string;
  completedAt?: string;
  messageCount?: number;
  stepCount?: number;
  firstUserMessage?: string;
  // For backwards compatibility
  lastEventTimestamp?: string;
  eventCount?: number;
}

// Event types for SignalR
// Backend sends: run.started, llm.delta, etc.
// Frontend uses: RunStarted, LlmDelta, etc.
export type EventType =
  | 'RunStarted'
  | 'RunCompleted'
  | 'RunFailed'
  | 'MessageUserCreated'
  | 'MessageAssistantCreated'
  | 'LlmStarted'
  | 'LlmDelta'
  | 'LlmCompleted'
  | 'ToolCallRequested'
  | 'ToolCallStarted'
  | 'ToolCallCompleted'
  | 'ApprovalRequested'
  | 'ApprovalResolved'
  | 'ArtifactCreated'
  | 'RunWaitingInput';

// Map from backend dot notation to frontend PascalCase
const eventTypeMap: Record<string, EventType> = {
  'run.started': 'RunStarted',
  'run.waiting_input': 'RunWaitingInput',
  'run.completed': 'RunCompleted',
  'run.failed': 'RunFailed',
  'message.user.created': 'MessageUserCreated',
  'message.assistant.created': 'MessageAssistantCreated',
  'llm.started': 'LlmStarted',
  'llm.delta': 'LlmDelta',
  'llm.completed': 'LlmCompleted',
  'tool.call.requested': 'ToolCallRequested',
  'tool.call.started': 'ToolCallStarted',
  'tool.call.completed': 'ToolCallCompleted',
  'approval.requested': 'ApprovalRequested',
  'approval.resolved': 'ApprovalResolved',
  'artifact.created': 'ArtifactCreated',
};

/**
 * Normalize event type from backend format (dot notation) to frontend format (PascalCase)
 */
export function normalizeEventType(eventType: string): EventType {
  // If it's already in PascalCase format, return as-is
  if (eventType in Object.values(eventTypeMap)) {
    return eventType as EventType;
  }
  // Convert from dot notation
  return eventTypeMap[eventType] ?? ('Unknown' as EventType);
}

export interface RunEvent {
  id: string;
  runId: string;
  stepId?: string;
  eventType: string; // Backend sends dot notation like "llm.delta"
  timestamp: string;
  correlationId: string;
  tenantId: string;
  // Event-specific properties are directly on the event object, not in a payload wrapper
  // LlmDelta events
  delta?: string;
  tokenIndex?: number;
  finishReason?: string;
  // LlmStarted events
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // LlmCompleted events
  fullContent?: string;
  inputTokens?: number;
  outputTokens?: number;
  duration?: string;
  // Message events
  messageId?: string;
  content?: string;
  // ToolCall events
  toolCallId?: string;
  toolName?: string;
  arguments?: unknown;
  riskTier?: RiskTier;
  requiresApproval?: boolean;
  result?: unknown;
  isSuccess?: boolean;
  error?: string;
  // Approval events
  approvalId?: string;
  decision?: ApprovalDecision;
  editedArguments?: string;
  reason?: string;
  resolvedBy?: string;
}

// Specific event payloads
export interface LlmDeltaPayload {
  delta: string;
  accumulatedContent: string;
}

export interface MessageCreatedPayload {
  messageId: string;
  content: string;
}

export interface ToolCallRequestedPayload {
  toolCallId: string;
  toolName: string;
  arguments: string;
  riskTier: RiskTier;
  requiresApproval: boolean;
}

export interface ToolCallCompletedPayload {
  toolCallId: string;
  result: string;
  isSuccess: boolean;
  error?: string;
}

export interface ApprovalRequestedPayload {
  approvalId: string;
  toolCallId: string;
  toolName: string;
  arguments: string;
  riskTier: RiskTier;
}

export interface ApprovalResolvedPayload {
  approvalId: string;
  decision: ApprovalDecision;
  editedArguments?: string;
  reason?: string;
  resolvedBy: string;
}

// Request types
export interface CreateRunRequest {
  initialMessage: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ApprovalResolutionRequest {
  decision: ApprovalDecision;
  editedArguments?: string;
  reason?: string;
}

// Knowledge Management Types
export const KnowledgeItemType = {
  Procedure: 'Procedure',
  Policy: 'Policy',
  Standard: 'Standard',
  Template: 'Template',
} as const;
export type KnowledgeItemType = (typeof KnowledgeItemType)[keyof typeof KnowledgeItemType];

export interface KnowledgeItemDto {
  id: string;
  type: KnowledgeItemType;
  name: string;
  description?: string;
  version?: string;
  category?: string;
  subcategory?: string;
  tags: string[];
  // Type-specific metadata
  owner?: string;
  effectiveDate?: string;
  codification?: string;
  stepCount?: number;
  // Full content as JSON for detailed view
  content?: unknown;
}

export interface KnowledgeItemSummaryDto {
  id: string;
  type: KnowledgeItemType;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags: string[];
}

export interface KnowledgeSearchRequest {
  type?: KnowledgeItemType;
  category?: string;
  subcategory?: string;
  keyword?: string;
  tags?: string[];
  skip?: number;
  take?: number;
}

export interface KnowledgeSearchResponse {
  items: KnowledgeItemSummaryDto[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface KnowledgeMetadataDto {
  categories: string[];
  subcategories: string[];
  tags: string[];
  typeCounts: Record<KnowledgeItemType, number>;
}
