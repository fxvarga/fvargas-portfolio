import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  type RunDto,
  type RunStatus,
  type MessageDto,
  type ToolCallDto,
  type ApprovalDto,
  type RunEvent,
  type ApprovalStatus,
  type RiskTier,
  normalizeEventType,
} from '@/types';

interface ChatState {
  // Current run state
  currentRunId: string | null;
  run: RunDto | null;
  isLoading: boolean;
  error: string | null;

  // Streaming state
  streamingContent: string;
  isStreaming: boolean;

  // Pending approvals
  pendingApprovals: ApprovalDto[];

  // Actions
  setRun: (run: RunDto | null) => void;
  setCurrentRunId: (runId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (delta: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  addMessage: (message: MessageDto) => void;
  updateRunStatus: (status: RunStatus) => void;
  addPendingApproval: (approval: ApprovalDto) => void;
  removePendingApproval: (approvalId: string) => void;
  handleEvent: (event: RunEvent) => void;
  reset: () => void;
}

const initialState = {
  currentRunId: null,
  run: null,
  isLoading: false,
  error: null,
  streamingContent: '',
  isStreaming: false,
  pendingApprovals: [],
};

export const useChatStore = create<ChatState>()(
  immer((set) => ({
    ...initialState,

    setRun: (run) =>
      set((state) => {
        state.run = run;
        state.currentRunId = run?.runId ?? null;
      }),

    setCurrentRunId: (runId) =>
      set((state) => {
        state.currentRunId = runId;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    setStreamingContent: (content) =>
      set((state) => {
        state.streamingContent = content;
      }),

    appendStreamingContent: (delta) =>
      set((state) => {
        state.streamingContent += delta;
      }),

    setIsStreaming: (streaming) =>
      set((state) => {
        state.isStreaming = streaming;
        if (!streaming) {
          state.streamingContent = '';
        }
      }),

    addMessage: (message) =>
      set((state) => {
        if (state.run) {
          state.run.messages.push(message);
        }
      }),

    updateRunStatus: (status) =>
      set((state) => {
        if (state.run) {
          state.run.status = status;
        }
      }),

    addPendingApproval: (approval) =>
      set((state) => {
        const exists = state.pendingApprovals.some((a) => a.id === approval.id);
        if (!exists) {
          state.pendingApprovals.push(approval);
        }
        if (state.run) {
          state.run.hasPendingApproval = true;
        }
      }),

    removePendingApproval: (approvalId) =>
      set((state) => {
        state.pendingApprovals = state.pendingApprovals.filter(
          (a) => a.id !== approvalId,
        );
        if (state.run && state.pendingApprovals.length === 0) {
          state.run.hasPendingApproval = false;
        }
      }),

    handleEvent: (event) => {
      // Normalize event type from backend format (dot notation) to frontend format (PascalCase)
      const eventType = normalizeEventType(event.eventType);
      
      switch (eventType) {
        case 'RunStarted':
          set((s) => {
            s.isLoading = false;
            if (s.run) {
              s.run.status = 'Running' as RunStatus;
            }
          });
          break;

        case 'RunCompleted':
          set((s) => {
            s.isStreaming = false;
            s.streamingContent = '';
            if (s.run) {
              s.run.status = 'Completed' as RunStatus;
            }
          });
          break;

        case 'RunWaitingInput':
          set((s) => {
            s.isStreaming = false;
            s.streamingContent = '';
            if (s.run) {
              s.run.status = 'WaitingInput' as RunStatus;
            }
          });
          break;

        case 'RunFailed':
          set((s) => {
            s.isStreaming = false;
            s.streamingContent = '';
            s.error = event.error ?? 'Run failed';
            if (s.run) {
              s.run.status = 'Failed' as RunStatus;
            }
          });
          break;

        case 'MessageUserCreated': {
          set((s) => {
            if (s.run && event.messageId && event.content) {
              // Check if message already exists
              const exists = s.run.messages.some(m => m.id === event.messageId);
              if (!exists) {
                s.run.messages.push({
                  id: event.messageId,
                  role: 'user',
                  content: event.content,
                  timestamp: event.timestamp,
                });
              }
            }
          });
          break;
        }

        case 'MessageAssistantCreated': {
          set((s) => {
            s.isStreaming = false;
            s.streamingContent = '';
            if (s.run && event.messageId && event.content) {
              // Check if message already exists
              const exists = s.run.messages.some(m => m.id === event.messageId);
              if (!exists) {
                s.run.messages.push({
                  id: event.messageId,
                  role: 'assistant',
                  content: event.content,
                  timestamp: event.timestamp,
                });
              }
            }
          });
          break;
        }

        case 'LlmStarted':
          set((s) => {
            s.isStreaming = true;
            s.streamingContent = '';
          });
          break;

        case 'LlmDelta': {
          set((s) => {
            // Accumulate delta - backend sends individual deltas
            if (event.delta) {
              s.streamingContent += event.delta;
            }
          });
          break;
        }

        case 'LlmCompleted':
          // Message will be created separately via MessageAssistantCreated
          break;

        case 'ToolCallRequested': {
          set((s) => {
            if (s.run && event.toolCallId && event.toolName) {
              // Add tool call to run's toolCalls array
              s.run.toolCalls.push({
                id: event.toolCallId,
                toolName: event.toolName,
                args: event.arguments,
                riskTier: (event.riskTier ?? 'Low') as RiskTier,
                status: 'pending',
                requiresApproval: event.requiresApproval,
                startedAt: event.timestamp,
              });
            }
          });
          break;
        }

        case 'ToolCallStarted': {
          // Tool execution started
          break;
        }

        case 'ToolCallCompleted': {
          set((s) => {
            if (s.run && event.toolCallId) {
              const toolCall = s.run.toolCalls.find(
                (tc: ToolCallDto) => tc.id === event.toolCallId,
              );
              if (toolCall) {
                toolCall.result = event.result;
                toolCall.status = event.isSuccess ? 'completed' : 'failed';
                if (!event.isSuccess) {
                  toolCall.error = event.error;
                }
              }
            }
          });
          break;
        }

        case 'ApprovalRequested': {
          set((s) => {
            if (s.run && event.approvalId && event.toolCallId && event.toolName) {
              s.run.status = 'WaitingForApproval' as RunStatus;
              s.run.hasPendingApproval = true;
              s.pendingApprovals.push({
                id: event.approvalId,
                runId: event.runId,
                stepId: event.stepId ?? '',
                toolCallId: event.toolCallId,
                toolName: event.toolName,
                originalArgs: event.arguments,
                riskTier: (event.riskTier ?? 'Low') as RiskTier,
                status: 'Pending' as ApprovalStatus,
              });
            }
          });
          break;
        }

        case 'ApprovalResolved': {
          set((s) => {
            if (event.approvalId) {
              s.pendingApprovals = s.pendingApprovals.filter(
                (a) => a.id !== event.approvalId,
              );
              if (s.pendingApprovals.length === 0 && s.run) {
                s.run.hasPendingApproval = false;
              }
            }
          });
          break;
        }

        case 'ArtifactCreated':
          // Handle artifact display if needed
          break;

        default:
          // Unknown event type - log for debugging but don't break
          console.debug('Unhandled event type:', eventType, event);
          break;
      }
    },

    reset: () => set(initialState),
  })),
);
