// ============================================================
// PreviewBanner — Floating banner shown at the top of the page
// when live preview of proposed changes is active.
// ============================================================

import React from "react";
import { useAgent } from "./AgentProvider";

export function PreviewBanner() {
  const { isPreviewActive, proposedChanges, togglePreview, discard, commit, isLoading } = useAgent();

  // Only show when there are proposed changes
  if (proposedChanges.length === 0) return null;

  return (
    <div className={`cap-preview-banner ${isPreviewActive ? "cap-preview-banner--active" : "cap-preview-banner--paused"}`}>
      <div className="cap-preview-banner__content">
        <div className="cap-preview-banner__status">
          <span className="cap-preview-banner__dot" />
          <span className="cap-preview-banner__text">
            {isPreviewActive ? "Preview Mode" : "Preview Paused"}
            {" \u2014 "}
            {proposedChanges.length} pending change{proposedChanges.length !== 1 ? "s" : ""}
            {!isPreviewActive && " (showing original content)"}
          </span>
        </div>
        <div className="cap-preview-banner__actions">
          <button
            className="cap-preview-banner__btn cap-preview-banner__btn--toggle"
            onClick={togglePreview}
            title={isPreviewActive ? "Pause preview (show original)" : "Resume preview"}
          >
            {isPreviewActive ? "Pause" : "Resume"}
          </button>
          <button
            className="cap-preview-banner__btn cap-preview-banner__btn--discard"
            onClick={() => discard()}
            disabled={isLoading}
          >
            Discard
          </button>
          <button
            className="cap-preview-banner__btn cap-preview-banner__btn--commit"
            onClick={() => commit()}
            disabled={isLoading}
          >
            {isLoading ? "Committing..." : "Commit All"}
          </button>
        </div>
      </div>
    </div>
  );
}
