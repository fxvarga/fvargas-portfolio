import { useEffect, useCallback, useState, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { sseConnection } from '@/api/sse';
import * as api from '@/api/client';
import type { ApprovalDecision, RunEvent, AssistantType } from '@/types';

export function useChat(runId?: string) {
  const store = useChatStore();
  const [resolvingApprovals, setResolvingApprovals] = useState<Set<string>>(
    new Set(),
  );
  const loadedRunIdRef = useRef<string | null>(null);

  // Load run data by ID
  const loadRunById = useCallback(async (id: string) => {
    // Prevent duplicate loads
    if (loadedRunIdRef.current === id) return;
    loadedRunIdRef.current = id;
    
    store.setLoading(true);
    store.setError(null);

    try {
      const run = await api.getRun(id);
      store.setRun(run);

      // Load pending approvals for this run
      const approvals = await api.getPendingApprovals();
      const runApprovals = approvals.filter((a) => a.runId === id);
      runApprovals.forEach((a) => store.addPendingApproval(a));
    } catch (error) {
      store.setError(
        error instanceof Error ? error.message : 'Failed to load run',
      );
      loadedRunIdRef.current = null; // Allow retry on error
    } finally {
      store.setLoading(false);
    }
  }, []);

  // Load run if runId is provided (e.g., from URL params)
  // Reset store if navigating to new chat (no runId)
  useEffect(() => {
    if (runId && runId !== store.currentRunId) {
      loadRunById(runId);
    } else if (!runId && store.currentRunId) {
      // Navigating to new chat - reset the store
      store.reset();
      loadedRunIdRef.current = null;
    }
  }, [runId, loadRunById]);

  // Connect to SSE for real-time events when we have a run
  useEffect(() => {
    const currentRunId = store.currentRunId;
    if (!currentRunId) return;

    const handleEvent = (event: RunEvent) => {
      // Use direct store access to avoid stale closures
      useChatStore.getState().handleEvent(event);
    };

    sseConnection.connect(currentRunId, handleEvent);

    return () => {
      sseConnection.disconnect();
    };
  }, [store.currentRunId]);

  // Create a new run
  const createRun = useCallback(async (initialMessage: string, assistantType?: AssistantType) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await api.createRun({ initialMessage, assistantType });
      // Fetch the full run after creation
      const run = await api.getRun(response.runId);
      store.setRun(run);
      return run;
    } catch (error) {
      store.setError(
        error instanceof Error ? error.message : 'Failed to create run',
      );
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, assistantType?: AssistantType) => {
      if (!store.currentRunId) {
        // Create a new run if none exists
        await createRun(content, assistantType);
        return;
      }

      try {
        await api.sendMessage(store.currentRunId, { content });
        // SSE will automatically receive the new events
      } catch (error) {
        store.setError(
          error instanceof Error ? error.message : 'Failed to send message',
        );
      }
    },
    [store.currentRunId, createRun],
  );

  // Resolve an approval
  const resolveApproval = useCallback(
    async (
      approvalId: string,
      decision: ApprovalDecision,
      editedArguments?: string,
      reason?: string,
    ) => {
      const currentRunId = useChatStore.getState().currentRunId;
      if (!currentRunId) {
        store.setError('No run to resolve approval for');
        return;
      }

      setResolvingApprovals((prev) => new Set(prev).add(approvalId));

      try {
        await api.resolveApproval(approvalId, currentRunId, {
          decision,
          editedArguments,
          reason,
        });
        store.removePendingApproval(approvalId);
      } catch (error) {
        store.setError(
          error instanceof Error ? error.message : 'Failed to resolve approval',
        );
      } finally {
        setResolvingApprovals((prev) => {
          const next = new Set(prev);
          next.delete(approvalId);
          return next;
        });
      }
    },
    [],
  );

  return {
    // State
    run: store.run,
    isLoading: store.isLoading,
    error: store.error,
    isStreaming: store.isStreaming,
    streamingContent: store.streamingContent,
    pendingApprovals: store.pendingApprovals,
    resolvingApprovals,

    // Actions
    loadRun: loadRunById,
    createRun,
    sendMessage,
    resolveApproval,
    reset: store.reset,
  };
}
