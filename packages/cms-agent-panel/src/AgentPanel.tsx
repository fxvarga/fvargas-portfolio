// ============================================================
// AgentPanel — Slide-out side panel with chat UI
// Self-contained, no external UI framework dependencies.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAgent } from "./AgentProvider";
import { uploadMedia } from "./api";
import { Markdown } from "./Markdown";
import type { ProposedChange, SectionDescriptor } from "./types";

// --------------- Sub-components ---------------

function MessageBubble({ message }: { message: { role: string; content: string; proposedChanges?: ProposedChange[] } }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const roleClass = isSystem ? "system" : isUser ? "user" : "assistant";
  return (
    <div className={`cap-message cap-message--${roleClass}`}>
      <div className="cap-message__bubble">
        {isSystem ? (
          <p className="cap-message__text">{message.content}</p>
        ) : (
          <Markdown content={message.content} className="cap-message__text" />
        )}
        {message.proposedChanges && message.proposedChanges.length > 0 && (
          <div className="cap-changes-inline">
            {message.proposedChanges.map((change) => (
              <ChangeCard key={change.id} change={change} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeCard({ change, compact }: { change: ProposedChange; compact?: boolean }) {
  const isDelete = change.fieldPath === "__delete__";

  return (
    <div className={`cap-change-card ${compact ? "cap-change-card--compact" : ""} ${isDelete ? "cap-change-card--delete" : ""}`}>
      <div className="cap-change-card__header">
        <span className="cap-change-card__entity">{change.entityType}</span>
        {isDelete ? (
          <span className="cap-change-card__field cap-change-card__field--delete">DELETE</span>
        ) : (
          <span className="cap-change-card__field">{change.fieldPath}</span>
        )}
      </div>
      {isDelete ? (
        <div className="cap-change-card__diff">
          <div className="cap-change-card__old">
            <span className="cap-change-card__label">Record:</span>
            <span className="cap-change-card__value">{change.oldValue}</span>
          </div>
        </div>
      ) : (
        <div className="cap-change-card__diff">
          <div className="cap-change-card__old">
            <span className="cap-change-card__label">Before:</span>
            <span className="cap-change-card__value">{change.oldValue || "(empty)"}</span>
          </div>
          <div className="cap-change-card__new">
            <span className="cap-change-card__label">After:</span>
            <span className="cap-change-card__value">{change.newValue}</span>
          </div>
        </div>
      )}
      {!compact && change.description && (
        <p className="cap-change-card__desc">{change.description}</p>
      )}
    </div>
  );
}

function CommitToolbar() {
  const { proposedChanges, commit, discard, isLoading, isPreviewActive, togglePreview } = useAgent();
  const [expanded, setExpanded] = useState(false);

  if (proposedChanges.length === 0) return null;

  return (
    <div className="cap-commit-toolbar">
      <div className="cap-commit-toolbar__summary">
        <button
          className="cap-commit-toolbar__toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label="Toggle change details"
        >
          {expanded ? "\u25BC" : "\u25B6"} {proposedChanges.length} pending change{proposedChanges.length !== 1 ? "s" : ""}
        </button>
        <div className="cap-commit-toolbar__actions">
          <button
            className={`cap-btn cap-btn--preview ${isPreviewActive ? "cap-btn--preview--active" : ""}`}
            onClick={togglePreview}
            title={isPreviewActive ? "Pause live preview" : "Resume live preview"}
            aria-label={isPreviewActive ? "Pause live preview" : "Resume live preview"}
          >
            {/* Eye icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isPreviewActive ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
          </button>
          <button
            className="cap-btn cap-btn--discard"
            onClick={() => discard()}
            disabled={isLoading}
          >
            Discard
          </button>
          <button
            className="cap-btn cap-btn--commit"
            onClick={() => commit()}
            disabled={isLoading}
          >
            {isLoading ? "Committing..." : "Commit All"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="cap-commit-toolbar__details">
          {proposedChanges.map((change) => (
            <ChangeCard key={change.id} change={change} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="cap-message cap-message--assistant">
      <div className="cap-message__bubble cap-message__bubble--loading">
        <span className="cap-loading-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}

function SectionBadge({ section, onClear }: { section: SectionDescriptor; onClear: () => void }) {
  return (
    <div className="cap-section-badge">
      <span className="cap-section-badge__icon">
        {/* Pin icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" />
        </svg>
      </span>
      <span className="cap-section-badge__label">Focused on:</span>
      <span className="cap-section-badge__entity">{section.entityType}</span>
      <span>{section.label}</span>
      <button
        className="cap-section-badge__clear"
        onClick={onClear}
        title="Clear section focus"
        aria-label="Clear section focus"
      >
        &times;
      </button>
    </div>
  );
}

// --------------- Main Panel ---------------

export function AgentPanel() {
  const {
    isOpen,
    messages,
    isLoading,
    error,
    closePanel,
    sendMessage,
    clearSession,
    toggleInspect,
    selectSection,
    isInspecting,
    selectedSection,
    pendingImageReplace,
    clearPendingImageReplace,
    config,
  } = useAgent();

  const hasSections = config.sections && config.sections.length > 0;

  const [input, setInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle pending image replace — pre-fill input with a replace message
  useEffect(() => {
    if (pendingImageReplace && isOpen) {
      const { entityType, fieldPath, recordId, recordName } = pendingImageReplace;
      let msg: string;
      if (recordName) {
        msg = `Replace the ${fieldPath} image for "${recordName}" (${entityType}, record ${recordId}) with a new image`;
      } else if (recordId) {
        msg = `Replace the ${fieldPath} image for ${entityType} record ${recordId} with a new image`;
      } else {
        msg = `Replace the image at ${entityType}.${fieldPath} with a new image`;
      }
      setInput(msg);
      clearPendingImageReplace();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingImageReplace, isOpen, clearPendingImageReplace]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be re-selected
      e.target.value = "";

      if (!file.type.startsWith("image/")) {
        return;
      }

      setIsUploadingImage(true);
      try {
        const result = await uploadMedia(config, file);
        if (result.success && result.asset) {
          // Send a message to the agent with the uploaded image URL
          const msg = `I uploaded an image: ${result.asset.url} (${result.asset.fileName})`;
          await sendMessage(msg);
        }
      } catch {
        // Upload error is handled silently — user can try again
      } finally {
        setIsUploadingImage(false);
      }
    },
    [config, sendMessage]
  );

  return (
    <>
      {/* Backdrop — hidden during inspect mode so user can interact with the page */}
      {isOpen && !isInspecting && (
        <div className="cap-backdrop" onClick={closePanel} />
      )}

      {/* Panel */}
      <div className={`cap-panel ${isOpen ? "cap-panel--open" : ""}`}>
        {/* Header */}
        <div className="cap-panel__header">
          <h3 className="cap-panel__title">CMS Agent</h3>
          <div className="cap-panel__header-actions">
            {hasSections && (
              <button
                className={`cap-btn cap-btn--inspect ${isInspecting ? "cap-btn--inspect--active" : ""}`}
                onClick={toggleInspect}
                title="Inspect section"
                aria-label="Inspect section"
              >
                {/* Crosshair icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
              </button>
            )}
            <button
              className="cap-btn cap-btn--icon"
              onClick={clearSession}
              title="New conversation"
              aria-label="New conversation"
            >
              &#x21bb;
            </button>
            <button
              className="cap-btn cap-btn--icon"
              onClick={closePanel}
              title="Close panel"
              aria-label="Close panel"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Selected Section Badge */}
        {selectedSection && (
          <SectionBadge
            section={selectedSection}
            onClear={() => selectSection(null)}
          />
        )}

        {/* Messages */}
        <div className="cap-panel__messages">
          {messages.length === 0 && (
            <div className="cap-empty-state">
              <p className="cap-empty-state__title">Ask me to edit your content</p>
              <p className="cap-empty-state__hint">
                Try: &quot;Change the hero title to Welcome&quot; or &quot;Update the about section description&quot;
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <LoadingDots />
          )}
          {error && (
            <div className="cap-error">
              <p>{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Commit Toolbar */}
        <CommitToolbar />

        {/* Input */}
        <div className="cap-panel__input">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            className="cap-btn cap-btn--attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploadingImage}
            title="Attach image"
            aria-label="Attach image"
          >
            {isUploadingImage ? (
              <span className="cap-loading-dots cap-loading-dots--inline">
                <span />
                <span />
                <span />
              </span>
            ) : (
              /* Paperclip icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>
          <textarea
            ref={inputRef}
            className="cap-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to edit your content..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="cap-btn cap-btn--send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            &#x27A4;
          </button>
        </div>
      </div>
    </>
  );
}
