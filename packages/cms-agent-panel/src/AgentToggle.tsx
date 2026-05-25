// ============================================================
// AgentToggle — Floating action button to open/close the panel.
// Shows badge with pending change count.
// ============================================================

import React from "react";
import { useAgent } from "./AgentProvider";

export function AgentToggle() {
  const { isOpen, togglePanel, proposedChanges } = useAgent();
  const changeCount = proposedChanges.length;

  return (
    <button
      className={`cap-toggle ${isOpen ? "cap-toggle--active" : ""}`}
      onClick={togglePanel}
      aria-label={isOpen ? "Close CMS Agent" : "Open CMS Agent"}
      title={isOpen ? "Close CMS Agent" : "Open CMS Agent"}
    >
      {/* Chat icon (SVG) */}
      <svg
        className="cap-toggle__icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Badge for pending changes */}
      {changeCount > 0 && (
        <span className="cap-toggle__badge">{changeCount}</span>
      )}
    </button>
  );
}
