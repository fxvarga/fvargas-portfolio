// ============================================================
// Types for the CMS Agent Panel
// Mirrors the backend AgentModels but in TypeScript.
// ============================================================

/** Describes a CMS-driven section on the page that can be inspected/selected. */
export interface SectionDescriptor {
  /** CSS selector to match the section element (e.g. "[name='hero']", ".tp-hero-section-1") */
  selector: string;
  /** CMS entity type (e.g. "hero", "about", "services") */
  entityType: string;
  /** Human-readable label shown in the inspector overlay (e.g. "Hero Section") */
  label: string;
}

/** Configuration needed to connect the agent panel to a backend. */
export interface AgentPanelConfig {
  /** GraphQL HTTP endpoint (e.g. "https://api.example.com/graphql") */
  graphqlUrl: string;
  /** GraphQL WebSocket endpoint (e.g. "wss://api.example.com/graphql") */
  wsUrl?: string;
  /** JWT auth token. If omitted the panel won't render. */
  token: string | null;
  /** Portfolio ID header value for multi-tenant resolution. */
  portfolioId?: string;
  /**
   * Sections on the page that can be inspected via the DevTools-style selector.
   * Each entry maps a CSS selector to a CMS entity type and label.
   */
  sections?: SectionDescriptor[];
  /**
   * The current page route (e.g. "/", "/blog", "/projects").
   * Passed to the backend so the LLM knows what page the user is viewing.
   */
  currentRoute?: string;
}

/** A single message in the chat history. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  proposedChanges?: ProposedChange[];
}

/** A proposed content change that has NOT been persisted yet. */
export interface ProposedChange {
  id: string;
  entityType: string;
  recordId?: string;
  fieldPath: string;
  oldValue: string;
  newValue: string;
  description: string;
}

/** Result of committing a batch of changes. */
export interface CommitResult {
  success: boolean;
  results: ChangeResult[];
  error?: string;
}

export interface ChangeResult {
  changeId: string;
  success: boolean;
  error?: string;
}

/** Streaming event from the agent via WebSocket subscription. */
export interface AgentStreamEvent {
  sessionId: string;
  eventType: "token" | "proposed_change" | "complete" | "error";
  token?: string;
  change?: ProposedChange;
  fullMessage?: string;
  error?: string;
}

/** State of the agent panel. */
export interface AgentState {
  isOpen: boolean;
  messages: ChatMessage[];
  proposedChanges: ProposedChange[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  /** Whether the DevTools-style section inspector is active. */
  isInspecting: boolean;
  /** The currently selected section (provides context for agent messages). */
  selectedSection: SectionDescriptor | null;
  /** Whether live preview of proposed changes is active on the page. */
  isPreviewActive: boolean;
  /** Pending image replace request from the inspector (auto-composes a chat message). */
  pendingImageReplace?: { entityType: string; fieldPath: string; recordId?: string; recordName?: string } | null;
}

/**
 * Callback the host app provides so the agent panel can notify it
 * about proposed changes (for live preview) and commits.
 */
export interface AgentPanelCallbacks {
  /** Called when new proposed changes arrive — host should preview them. */
  onPreviewChanges?: (changes: ProposedChange[]) => void;
  /** Called when changes are committed — host should refetch CMS data. Can be async. */
  onCommitted?: (result: CommitResult) => void | Promise<void>;
  /** Called when proposed changes are discarded. */
  onDiscard?: () => void;
}

// ============================================================
// Media Library Types
// ============================================================

/** A media asset uploaded to the CMS media library. */
export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  uploadedAt: string;
}

/** Result returned after uploading a media file. */
export interface MediaUploadResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}
