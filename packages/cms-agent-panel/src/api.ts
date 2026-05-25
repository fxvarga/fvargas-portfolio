// ============================================================
// Lightweight GraphQL client — no Apollo dependency.
// Uses plain fetch for mutations and graphql-ws for subscriptions.
// ============================================================

import { createClient, type Client } from "graphql-ws";
import type {
  AgentPanelConfig,
  ProposedChange,
  CommitResult,
  AgentStreamEvent,
  ChatMessage,
  MediaUploadResult,
} from "./types";

// --------------- GraphQL Operations ---------------

const AGENT_CHAT_MUTATION = `
  mutation AgentChat($input: AgentChatInput!) {
    agentChat(input: $input) {
      message
      sessionId
      proposedChanges {
        id
        entityType
        recordId
        fieldPath
        oldValue
        newValue
        description
      }
    }
  }
`;

const AGENT_COMMIT_MUTATION = `
  mutation AgentCommit($input: AgentCommitInput!) {
    agentCommit(input: $input) {
      success
      results {
        changeId
        success
        error
      }
      error
    }
  }
`;

const AGENT_STREAM_SUBSCRIPTION = `
  subscription OnAgentEvent($sessionId: String!) {
    onAgentEvent(sessionId: $sessionId) {
      sessionId
      eventType
      token
      change {
        id
        entityType
        recordId
        fieldPath
        oldValue
        newValue
        description
      }
      fullMessage
      error
    }
  }
`;

// --------------- HTTP helpers ---------------

function buildHeaders(config: AgentPanelConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }
  if (config.portfolioId) {
    headers["X-Portfolio-ID"] = config.portfolioId;
  }
  return headers;
}

async function gqlFetch<T>(
  config: AgentPanelConfig,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(config.graphqlUrl, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return json.data as T;
}

// --------------- Login ---------------

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      token
      user {
        id
        username
        role
      }
      portfolios {
        id
        slug
        name
      }
      errorMessage
    }
  }
`;

export interface LoginPortfolio {
  id: string;
  slug: string;
  name: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: { id: string; username: string; role: string };
  portfolios?: LoginPortfolio[];
  errorMessage?: string;
}

/**
 * Authenticate against the CMS backend.
 * On success, stores the token and portfolio list in localStorage.
 */
export async function loginAgent(
  graphqlUrl: string,
  username: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { input: { username, password } },
    }),
  });

  if (!res.ok) {
    throw new Error(`Login request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }

  return json.data.login as LoginResult;
}

// --------------- Public API ---------------

export interface AgentChatResponse {
  message: string;
  sessionId: string;
  proposedChanges: ProposedChange[];
}

export async function sendAgentMessage(
  config: AgentPanelConfig,
  message: string,
  history: ChatMessage[],
  sessionId: string | null,
  focusedSection?: string,
  currentRoute?: string
): Promise<AgentChatResponse> {
  // Only send user/assistant messages as conversation history — system messages are UI-only
  const conversationHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const input: Record<string, unknown> = {
    message,
    conversationHistory,
    sessionId,
  };
  if (focusedSection) input.focusedSection = focusedSection;
  if (currentRoute) input.currentRoute = currentRoute;

  const data = await gqlFetch<{ agentChat: AgentChatResponse }>(
    config,
    AGENT_CHAT_MUTATION,
    { input }
  );

  return data.agentChat;
}

export async function commitChanges(
  config: AgentPanelConfig,
  changes: ProposedChange[]
): Promise<CommitResult> {
  const data = await gqlFetch<{ agentCommit: CommitResult }>(
    config,
    AGENT_COMMIT_MUTATION,
    {
      input: {
        changes: changes.map((c) => ({
          id: c.id,
          entityType: c.entityType,
          recordId: c.recordId,
          fieldPath: c.fieldPath,
          oldValue: c.oldValue,
          newValue: c.newValue,
          description: c.description,
        })),
      },
    }
  );

  return data.agentCommit;
}

// --------------- Media Upload (REST) ---------------

/**
 * Derive the REST base URL from the GraphQL URL.
 * e.g. "https://api.example.com/graphql" -> "https://api.example.com"
 *      "/graphql" -> ""
 */
function deriveRestBaseUrl(config: AgentPanelConfig): string {
  return config.graphqlUrl.replace(/\/graphql\/?$/, "");
}

/**
 * Upload a media file to the CMS media library via REST endpoint.
 * Uses fetch + FormData (no Apollo dependency).
 */
export async function uploadMedia(
  config: AgentPanelConfig,
  file: File,
  altText?: string
): Promise<MediaUploadResult> {
  const restBaseUrl = deriveRestBaseUrl(config);
  const formData = new FormData();
  formData.append("file", file);
  if (altText) {
    formData.append("altText", altText);
  }

  // Build headers WITHOUT Content-Type — browser sets it with boundary for multipart
  const headers: Record<string, string> = {};
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }
  if (config.portfolioId) {
    headers["X-Portfolio-ID"] = config.portfolioId;
  }

  try {
    const res = await fetch(`${restBaseUrl}/api/media`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      return {
        success: false,
        error: errBody?.error || `Upload failed: ${res.status} ${res.statusText}`,
      };
    }

    const asset = await res.json();
    return { success: true, asset };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

// --------------- WebSocket subscription ---------------

/**
 * Derive the WebSocket URL from the HTTP URL if not explicitly provided.
 * e.g. https://api.example.com/graphql -> wss://api.example.com/graphql
 */
function deriveWsUrl(config: AgentPanelConfig): string {
  if (config.wsUrl) return config.wsUrl;
  return config.graphqlUrl
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
}

export function createAgentSubscription(
  config: AgentPanelConfig,
  sessionId: string,
  onEvent: (event: AgentStreamEvent) => void,
  onError?: (err: unknown) => void
): () => void {
  const wsUrl = deriveWsUrl(config);

  const client: Client = createClient({
    url: wsUrl,
    connectionParams: () => {
      const params: Record<string, string> = {};
      if (config.token) {
        params["Authorization"] = `Bearer ${config.token}`;
      }
      if (config.portfolioId) {
        params["X-Portfolio-ID"] = config.portfolioId;
      }
      return params;
    },
  });

  let unsubscribe: (() => void) | null = null;

  // graphql-ws subscribe returns a cleanup function
  unsubscribe = client.subscribe<{ onAgentEvent: AgentStreamEvent }>(
    {
      query: AGENT_STREAM_SUBSCRIPTION,
      variables: { sessionId },
    },
    {
      next: (result) => {
        if (result.data?.onAgentEvent) {
          onEvent(result.data.onAgentEvent);
        }
      },
      error: (err) => {
        onError?.(err);
      },
      complete: () => {
        // Subscription ended naturally
      },
    }
  );

  // Return cleanup
  return () => {
    unsubscribe?.();
    client.dispose();
  };
}
