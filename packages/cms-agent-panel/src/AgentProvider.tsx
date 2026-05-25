// ============================================================
// AgentProvider — React context + provider + useAgent hook
// Manages chat state, streaming, proposed changes, session.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type {
  AgentPanelConfig,
  AgentPanelCallbacks,
  AgentState,
  ChatMessage,
  ProposedChange,
  AgentStreamEvent,
  SectionDescriptor,
} from "./types";
import {
  sendAgentMessage,
  commitChanges as apiCommitChanges,
  createAgentSubscription,
} from "./api";

// --------------- State management ---------------

type Action =
  | { type: "TOGGLE_PANEL" }
  | { type: "OPEN_PANEL" }
  | { type: "CLOSE_PANEL" }
  | { type: "SEND_MESSAGE"; message: ChatMessage }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RECEIVE_RESPONSE"; message: ChatMessage; sessionId: string }
  | { type: "ADD_PROPOSED_CHANGES"; changes: ProposedChange[] }
  | { type: "STREAM_TOKEN"; token: string }
  | { type: "STREAM_COMPLETE"; fullMessage: string }
  | { type: "DISCARD_CHANGES"; changeIds?: string[] }
  | { type: "COMMIT_SUCCESS" }
  | { type: "SET_SESSION"; sessionId: string }
  | { type: "CLEAR_SESSION" }
  | { type: "TOGGLE_INSPECT" }
  | { type: "SELECT_SECTION"; section: SectionDescriptor | null }
  | { type: "TOGGLE_PREVIEW" }
  | { type: "REQUEST_IMAGE_REPLACE"; entityType: string; fieldPath: string; recordId?: string; recordName?: string }
  | { type: "CLEAR_PENDING_IMAGE_REPLACE" };

const initialState: AgentState = {
  isOpen: false,
  messages: [],
  proposedChanges: [],
  sessionId: null,
  isLoading: false,
  error: null,
  isInspecting: false,
  selectedSection: null,
  isPreviewActive: true, // Preview is on by default when changes exist
  pendingImageReplace: null,
};

function agentReducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "TOGGLE_PANEL":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_PANEL":
      return { ...state, isOpen: true };
    case "CLOSE_PANEL":
      return { ...state, isOpen: false };
    case "SEND_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
        isLoading: true,
        error: null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "RECEIVE_RESPONSE": {
      // If streaming already created an assistant message (last msg is assistant),
      // replace it with the final HTTP response. Otherwise append.
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant" && last.id.startsWith("stream-")) {
        msgs[msgs.length - 1] = action.message;
      } else {
        msgs.push(action.message);
      }
      return {
        ...state,
        messages: msgs,
        sessionId: action.sessionId,
        isLoading: false,
      };
    }
    case "ADD_PROPOSED_CHANGES":
      return {
        ...state,
        proposedChanges: [...state.proposedChanges, ...action.changes],
      };
    case "STREAM_TOKEN": {
      // Append token to the last assistant message, or create one
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = {
          ...last,
          content: last.content + action.token,
        };
      } else {
        msgs.push({
          id: `stream-${Date.now()}`,
          role: "assistant",
          content: action.token,
          timestamp: new Date(),
        });
      }
      return { ...state, messages: msgs };
    }
    case "STREAM_COMPLETE": {
      // Replace last streaming message with final content
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = {
          ...last,
          content: action.fullMessage,
        };
      }
      return { ...state, messages: msgs, isLoading: false };
    }
    case "DISCARD_CHANGES": {
      if (!action.changeIds) {
        return { ...state, proposedChanges: [] };
      }
      const discardSet = new Set(action.changeIds);
      return {
        ...state,
        proposedChanges: state.proposedChanges.filter(
          (c) => !discardSet.has(c.id)
        ),
      };
    }
    case "COMMIT_SUCCESS":
      return { ...state, proposedChanges: [] };
    case "SET_SESSION":
      return { ...state, sessionId: action.sessionId };
    case "CLEAR_SESSION":
      return { ...initialState };
    case "TOGGLE_INSPECT":
      return { ...state, isInspecting: !state.isInspecting };
    case "SELECT_SECTION":
      return { ...state, selectedSection: action.section, isInspecting: false };
    case "TOGGLE_PREVIEW":
      return { ...state, isPreviewActive: !state.isPreviewActive };
    case "REQUEST_IMAGE_REPLACE":
      return {
        ...state,
        isOpen: true,
        isInspecting: false,
        pendingImageReplace: {
          entityType: action.entityType,
          fieldPath: action.fieldPath,
          recordId: action.recordId,
          recordName: action.recordName,
        },
      };
    case "CLEAR_PENDING_IMAGE_REPLACE":
      return { ...state, pendingImageReplace: null };
    default:
      return state;
  }
}

// --------------- Context ---------------

export interface AgentContextValue extends AgentState {
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  commit: (changeIds?: string[]) => Promise<void>;
  discard: (changeIds?: string[]) => void;
  clearSession: () => void;
  toggleInspect: () => void;
  selectSection: (section: SectionDescriptor | null) => void;
  togglePreview: () => void;
  requestImageReplace: (entityType: string, fieldPath: string, recordId?: string, recordName?: string) => void;
  clearPendingImageReplace: () => void;
  config: AgentPanelConfig;
}

const AgentContext = createContext<AgentContextValue | null>(null);

// --------------- Provider ---------------

export interface AgentProviderProps {
  config: AgentPanelConfig;
  callbacks?: AgentPanelCallbacks;
  children: React.ReactNode;
}

export function AgentProvider({
  config,
  callbacks,
  children,
}: AgentProviderProps) {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Track subscription cleanup
  const unsubRef = useRef<(() => void) | null>(null);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  // Subscribe to streaming events when we have a session
  useEffect(() => {
    if (!state.sessionId || !config.token) return;

    unsubRef.current?.();

    const unsub = createAgentSubscription(
      config,
      state.sessionId,
      (event: AgentStreamEvent) => {
        switch (event.eventType) {
          case "token":
            if (event.token) {
              dispatch({ type: "STREAM_TOKEN", token: event.token });
            }
            break;
          case "proposed_change":
            if (event.change) {
              dispatch({
                type: "ADD_PROPOSED_CHANGES",
                changes: [event.change],
              });
              callbacksRef.current?.onPreviewChanges?.([
                ...state.proposedChanges,
                event.change,
              ]);
            }
            break;
          case "complete":
            if (event.fullMessage) {
              dispatch({
                type: "STREAM_COMPLETE",
                fullMessage: event.fullMessage,
              });
            }
            break;
          case "error":
            dispatch({
              type: "SET_ERROR",
              error: event.error ?? "Unknown streaming error",
            });
            break;
        }
      },
      (err) => {
        console.error("[cms-agent-panel] Subscription error:", err);
        dispatch({
          type: "SET_ERROR",
          error: "Connection lost. Please try again.",
        });
      }
    );

    unsubRef.current = unsub;

    return () => {
      unsub();
      unsubRef.current = null;
    };
    // Only re-subscribe when sessionId or config changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId, config.token, config.graphqlUrl]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !config.token) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      dispatch({ type: "SEND_MESSAGE", message: userMsg });

      // Send section context and page route as dedicated fields (not baked into the message).
      // Read window.location.pathname at send time so it's always current,
      // even after client-side navigation (config.currentRoute may be stale from useMemo).
      const focusedSection = state.selectedSection?.entityType ?? undefined;
      const currentRoute = (typeof window !== "undefined" ? window.location.pathname : config.currentRoute) ?? undefined;

      // Track whether the subscription is active. When it is, the WebSocket
      // already delivers tokens, proposed changes, and a completion event —
      // the HTTP response would only duplicate those messages/changes.
      try {
        const response = await sendAgentMessage(
          config,
          content.trim(),
          state.messages,
          state.sessionId,
          focusedSection,
          currentRoute
        );

        // Always use the HTTP response directly. Streaming via WebSocket is
        // unreliable in production (WS may fail to connect/deliver), so we
        // treat the HTTP response as the source of truth. If streaming tokens
        // arrived first, STREAM_COMPLETE will overwrite with the final message
        // anyway — but we never rely on it.
        {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
            proposedChanges:
              response.proposedChanges.length > 0
                ? response.proposedChanges
                : undefined,
          };

          dispatch({
            type: "RECEIVE_RESPONSE",
            message: assistantMsg,
            sessionId: response.sessionId,
          });

          if (response.proposedChanges.length > 0) {
            dispatch({
              type: "ADD_PROPOSED_CHANGES",
              changes: response.proposedChanges,
            });
            callbacksRef.current?.onPreviewChanges?.(response.proposedChanges);
          }
        }
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error:
            err instanceof Error ? err.message : "Failed to send message",
        });
      }
    },
    [config, state.messages, state.sessionId, state.selectedSection]
  );

  const commit = useCallback(
    async (changeIds?: string[]) => {
      const changesToCommit = changeIds
        ? state.proposedChanges.filter((c) => changeIds.includes(c.id))
        : state.proposedChanges;

      if (changesToCommit.length === 0) return;

      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const result = await apiCommitChanges(config, changesToCommit);

        if (result.success) {
          dispatch({ type: "COMMIT_SUCCESS" });

          // Add success feedback message to chat
          const successCount = result.results.filter((r) => r.success).length;
          dispatch({
            type: "RECEIVE_RESPONSE",
            message: {
              id: `system-commit-${Date.now()}`,
              role: "system",
              content: `Committed ${successCount} change${successCount !== 1 ? "s" : ""} successfully. The page content has been updated.`,
              timestamp: new Date(),
            },
            sessionId: state.sessionId ?? "",
          });

          callbacksRef.current?.onCommitted?.(result);
        } else {
          const errorMsg = result.error ?? "Commit failed";
          dispatch({
            type: "SET_ERROR",
            error: errorMsg,
          });

          // Add failure feedback message to chat
          dispatch({
            type: "RECEIVE_RESPONSE",
            message: {
              id: `system-commit-error-${Date.now()}`,
              role: "system",
              content: `Commit failed: ${errorMsg}`,
              timestamp: new Date(),
            },
            sessionId: state.sessionId ?? "",
          });
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to commit changes";
        dispatch({
          type: "SET_ERROR",
          error: errorMsg,
        });

        // Add failure feedback message to chat
        dispatch({
          type: "RECEIVE_RESPONSE",
          message: {
            id: `system-commit-error-${Date.now()}`,
            role: "system",
            content: `Commit failed: ${errorMsg}`,
            timestamp: new Date(),
          },
          sessionId: state.sessionId ?? "",
        });
      }
    },
    [config, state.proposedChanges, state.sessionId]
  );

  const discard = useCallback(
    (changeIds?: string[]) => {
      const count = changeIds
        ? changeIds.length
        : state.proposedChanges.length;
      dispatch({ type: "DISCARD_CHANGES", changeIds });

      // Add discard feedback message to chat if there were changes
      if (count > 0) {
        dispatch({
          type: "RECEIVE_RESPONSE",
          message: {
            id: `system-discard-${Date.now()}`,
            role: "system",
            content: `Discarded ${count} pending change${count !== 1 ? "s" : ""}. The page is showing the original content.`,
            timestamp: new Date(),
          },
          sessionId: state.sessionId ?? "",
        });
      }

      callbacksRef.current?.onDiscard?.();
    },
    [state.proposedChanges.length, state.sessionId]
  );

  const togglePanel = useCallback(() => dispatch({ type: "TOGGLE_PANEL" }), []);
  const openPanel = useCallback(() => dispatch({ type: "OPEN_PANEL" }), []);
  const closePanel = useCallback(() => dispatch({ type: "CLOSE_PANEL" }), []);
  const clearSession = useCallback(
    () => dispatch({ type: "CLEAR_SESSION" }),
    []
  );
  const toggleInspect = useCallback(
    () => dispatch({ type: "TOGGLE_INSPECT" }),
    []
  );
  const selectSection = useCallback(
    (section: SectionDescriptor | null) =>
      dispatch({ type: "SELECT_SECTION", section }),
    []
  );
  const togglePreview = useCallback(
    () => dispatch({ type: "TOGGLE_PREVIEW" }),
    []
  );
  const requestImageReplace = useCallback(
    (entityType: string, fieldPath: string, recordId?: string, recordName?: string) =>
      dispatch({ type: "REQUEST_IMAGE_REPLACE", entityType, fieldPath, recordId, recordName }),
    []
  );
  const clearPendingImageReplace = useCallback(
    () => dispatch({ type: "CLEAR_PENDING_IMAGE_REPLACE" }),
    []
  );

  const value = useMemo<AgentContextValue>(
    () => ({
      ...state,
      togglePanel,
      openPanel,
      closePanel,
      sendMessage,
      commit,
      discard,
      clearSession,
      toggleInspect,
      selectSection,
      togglePreview,
      requestImageReplace,
      clearPendingImageReplace,
      config,
    }),
    [state, togglePanel, openPanel, closePanel, sendMessage, commit, discard, clearSession, toggleInspect, selectSection, togglePreview, requestImageReplace, clearPendingImageReplace, config]
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

// --------------- Hook ---------------

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used within an <AgentProvider>");
  }
  return ctx;
}
