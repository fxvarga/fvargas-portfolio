// ============================================================
// @fvargas/cms-agent-panel — barrel export
// ============================================================

// Types
export type {
  AgentPanelConfig,
  SectionDescriptor,
  ChatMessage,
  ProposedChange,
  CommitResult,
  ChangeResult,
  AgentStreamEvent,
  AgentState,
  AgentPanelCallbacks,
  MediaAsset,
  MediaUploadResult,
} from "./types";

// API (for advanced consumers who want to call GraphQL directly)
export {
  sendAgentMessage,
  commitChanges,
  createAgentSubscription,
  loginAgent,
  uploadMedia,
} from "./api";
export type { AgentChatResponse, LoginResult, LoginPortfolio } from "./api";

// React components and hooks
export { AgentProvider, useAgent } from "./AgentProvider";
export type { AgentContextValue } from "./AgentProvider";
export { AgentPanel } from "./AgentPanel";
export { AgentToggle } from "./AgentToggle";
export { SectionInspector } from "./SectionInspector";
export { PreviewBanner } from "./PreviewBanner";
