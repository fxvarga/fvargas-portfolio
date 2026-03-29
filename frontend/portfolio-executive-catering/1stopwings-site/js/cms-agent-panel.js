/**
 * @fvargas/cms-agent-panel-vanilla v0.1.0
 * Self-contained CMS Agent Panel for static HTML sites.
 * No framework dependencies — just load via <script> tag.
 *
 * Usage:
 *   <script src="cms-agent-panel.js"></script>
 *   <script>
 *     CmsAgentPanel.init({
 *       graphqlUrl: '/graphql',
 *       sections: [ { selector: '.hero', entityType: 'hero', label: 'Hero Section' } ],
 *       portfolioId: '55555555-5555-5555-5555-555555555555'
 *     });
 *   </script>
 */
(function() {
  'use strict';

  // --- Inject CSS ---
  var style = document.createElement('style');
  style.setAttribute('data-cap-vanilla', '');
  style.textContent = `/* ============================================================
   @fvargas/cms-agent-panel — Self-contained styles
   All classes prefixed with "cap-" to avoid collisions.
   No external framework dependencies.
   ============================================================ */

/* --------------- CSS Custom Properties --------------- */
:root {
  --cap-panel-width: 400px;
  --cap-panel-bg: #ffffff;
  --cap-panel-border: #e2e8f0;
  --cap-header-bg: #1a1a2e;
  --cap-header-text: #ffffff;
  --cap-user-bg: #3b82f6;
  --cap-user-text: #ffffff;
  --cap-assistant-bg: #f1f5f9;
  --cap-assistant-text: #0f172a;
  --cap-input-bg: #ffffff;
  --cap-input-border: #cbd5e1;
  --cap-input-focus: #3b82f6;
  --cap-btn-commit: #22c55e;
  --cap-btn-commit-hover: #16a34a;
  --cap-btn-discard: #ef4444;
  --cap-btn-discard-hover: #dc2626;
  --cap-btn-send: #3b82f6;
  --cap-btn-send-hover: #2563eb;
  --cap-change-old-bg: #fef2f2;
  --cap-change-old-text: #991b1b;
  --cap-change-new-bg: #f0fdf4;
  --cap-change-new-text: #166534;
  --cap-toggle-bg: #3b82f6;
  --cap-toggle-hover: #2563eb;
  --cap-toggle-text: #ffffff;
  --cap-badge-bg: #ef4444;
  --cap-badge-text: #ffffff;
  --cap-backdrop-bg: rgba(0, 0, 0, 0.3);
  --cap-error-bg: #fef2f2;
  --cap-error-text: #991b1b;
  --cap-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  --cap-radius: 8px;
  --cap-radius-sm: 6px;
  --cap-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --cap-font-size: 14px;
  --cap-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --------------- Backdrop --------------- */
.cap-backdrop {
  position: fixed;
  inset: 0;
  background: var(--cap-backdrop-bg);
  z-index: 99998;
  animation: cap-fade-in 0.2s ease;
}

@keyframes cap-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* --------------- Panel --------------- */
.cap-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: var(--cap-panel-width);
  max-width: 100vw;
  height: 100vh;
  background: var(--cap-panel-bg);
  box-shadow: var(--cap-shadow);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  font-family: var(--cap-font);
  font-size: var(--cap-font-size);
  transform: translateX(100%);
  transition: transform var(--cap-transition);
}

.cap-panel--open {
  transform: translateX(0);
}

/* Header */
.cap-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--cap-header-bg);
  color: var(--cap-header-text);
  flex-shrink: 0;
}

.cap-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.cap-panel__header-actions {
  display: flex;
  gap: 4px;
}

/* Messages area */
.cap-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Input area */
.cap-panel__input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--cap-panel-border);
  flex-shrink: 0;
  background: var(--cap-input-bg);
}

/* --------------- Messages --------------- */
.cap-message {
  display: flex;
  max-width: 85%;
}

.cap-message--user {
  align-self: flex-end;
}

.cap-message--assistant {
  align-self: flex-start;
}

.cap-message--system {
  align-self: center;
  max-width: 90%;
}

.cap-message__bubble {
  padding: 10px 14px;
  border-radius: var(--cap-radius);
  line-height: 1.5;
  word-wrap: break-word;
}

.cap-message--user .cap-message__bubble {
  background: var(--cap-user-bg);
  color: var(--cap-user-text);
  border-bottom-right-radius: 2px;
}

.cap-message--assistant .cap-message__bubble {
  background: var(--cap-assistant-bg);
  color: var(--cap-assistant-text);
  border-bottom-left-radius: 2px;
}

.cap-message--system .cap-message__bubble {
  background: #f0f9ff;
  color: #0c4a6e;
  border: 1px solid #bae6fd;
  border-radius: var(--cap-radius);
  text-align: center;
  font-size: 0.85em;
  font-style: italic;
}

.cap-message__text {
  margin: 0;
}

/* --------------- Markdown Renderer Styles --------------- */
/*
 * IMPORTANT: The host site (dark-theme portfolio) sets global styles on
 * bare elements (p, h1-h6, li, a, code) with light-on-dark colors.
 * We MUST use high-specificity selectors scoped to .cap-panel to override.
 */

.cap-md {
  margin: 0;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Reset ALL descendant text color inside assistant bubbles to beat global dark-theme styles */
.cap-panel .cap-message--assistant .cap-message__bubble,
.cap-panel .cap-message--assistant .cap-message__bubble p,
.cap-panel .cap-message--assistant .cap-message__bubble h1,
.cap-panel .cap-message--assistant .cap-message__bubble h2,
.cap-panel .cap-message--assistant .cap-message__bubble h3,
.cap-panel .cap-message--assistant .cap-message__bubble h4,
.cap-panel .cap-message--assistant .cap-message__bubble h5,
.cap-panel .cap-message--assistant .cap-message__bubble h6,
.cap-panel .cap-message--assistant .cap-message__bubble li,
.cap-panel .cap-message--assistant .cap-message__bubble span,
.cap-panel .cap-message--assistant .cap-message__bubble strong,
.cap-panel .cap-message--assistant .cap-message__bubble em {
  color: #0f172a; /* slate-900 — strong contrast on light bg */
}

/* Same reset for user bubbles — white text */
.cap-panel .cap-message--user .cap-message__bubble,
.cap-panel .cap-message--user .cap-message__bubble p,
.cap-panel .cap-message--user .cap-message__bubble h1,
.cap-panel .cap-message--user .cap-message__bubble h2,
.cap-panel .cap-message--user .cap-message__bubble h3,
.cap-panel .cap-message--user .cap-message__bubble h4,
.cap-panel .cap-message--user .cap-message__bubble h5,
.cap-panel .cap-message--user .cap-message__bubble h6,
.cap-panel .cap-message--user .cap-message__bubble li,
.cap-panel .cap-message--user .cap-message__bubble span,
.cap-panel .cap-message--user .cap-message__bubble strong,
.cap-panel .cap-message--user .cap-message__bubble em {
  color: #ffffff;
}

.cap-md-p {
  margin: 0 0 8px 0;
}

.cap-md-p:last-child {
  margin-bottom: 0;
}

/* Headings */
.cap-md-heading {
  margin: 12px 0 6px 0;
  line-height: 1.3;
}

.cap-md-heading:first-child {
  margin-top: 0;
}

.cap-md-h1 { font-size: 1.25em; font-weight: 700; }
.cap-md-h2 { font-size: 1.15em; font-weight: 700; }
.cap-md-h3 { font-size: 1.05em; font-weight: 600; }
.cap-md-h4,
.cap-md-h5,
.cap-md-h6 { font-size: 1em; font-weight: 600; }

/* Bold & Italic */
.cap-md-bold {
  font-weight: 600;
}

.cap-md-italic {
  font-style: italic;
}

/* Inline code */
.cap-panel .cap-message--assistant .cap-md-code {
  background: rgba(0, 0, 0, 0.06);
  color: #0f172a;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9em;
}

.cap-panel .cap-message--user .cap-md-code {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9em;
}

/* Code blocks */
.cap-panel .cap-md-pre {
  margin: 8px 0;
  padding: 10px 12px;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.cap-panel .cap-md-pre:last-child {
  margin-bottom: 0;
}

.cap-panel .cap-md-codeblock {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background: none;
  padding: 0;
  white-space: pre;
  color: #e2e8f0;
}

/* Lists */
.cap-md-ul,
.cap-md-ol {
  margin: 6px 0;
  padding-left: 20px;
}

.cap-md-ul:last-child,
.cap-md-ol:last-child {
  margin-bottom: 0;
}

.cap-md-ul li,
.cap-md-ol li {
  margin-bottom: 3px;
}

.cap-md-ul li:last-child,
.cap-md-ol li:last-child {
  margin-bottom: 0;
}

/* Horizontal rules (rendered as --- text) */
.cap-md-hr {
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 10px 0;
}

/* Links */
.cap-panel .cap-message--assistant .cap-md-link {
  color: #2563eb;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cap-panel .cap-message--assistant .cap-md-link:hover {
  color: #1d4ed8;
}

.cap-panel .cap-message--user .cap-md-link {
  color: #bfdbfe;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cap-panel .cap-message--user .cap-md-link:hover {
  color: #ffffff;
}

/* --------------- Change Cards --------------- */
.cap-changes-inline {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cap-change-card {
  border: 1px solid var(--cap-panel-border);
  border-radius: var(--cap-radius-sm);
  padding: 8px 10px;
  font-size: 12px;
  background: var(--cap-panel-bg);
}

.cap-change-card--compact {
  padding: 6px 8px;
}

.cap-change-card__header {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-weight: 600;
}

.cap-change-card__entity {
  color: #6366f1;
}

.cap-change-card__field {
  color: #64748b;
  font-weight: 400;
  font-family: monospace;
}

.cap-change-card__diff {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cap-change-card__old {
  background: var(--cap-change-old-bg);
  color: var(--cap-change-old-text);
  padding: 3px 6px;
  border-radius: 3px;
  display: flex;
  gap: 6px;
}

.cap-change-card__new {
  background: var(--cap-change-new-bg);
  color: var(--cap-change-new-text);
  padding: 3px 6px;
  border-radius: 3px;
  display: flex;
  gap: 6px;
}

.cap-change-card__label {
  font-weight: 600;
  flex-shrink: 0;
}

.cap-change-card__value {
  word-break: break-word;
}

.cap-change-card__desc {
  margin: 6px 0 0;
  color: #64748b;
  font-style: italic;
}

/* --------------- Commit Toolbar --------------- */
.cap-commit-toolbar {
  border-top: 1px solid var(--cap-panel-border);
  background: #fafafa;
  flex-shrink: 0;
}

.cap-commit-toolbar__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
}

.cap-commit-toolbar__toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--cap-assistant-text);
  padding: 4px 0;
  font-family: var(--cap-font);
}

.cap-commit-toolbar__toggle:hover {
  color: var(--cap-btn-send);
}

.cap-commit-toolbar__actions {
  display: flex;
  gap: 8px;
}

.cap-commit-toolbar__details {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

/* --------------- Buttons --------------- */
.cap-btn {
  border: none;
  cursor: pointer;
  font-family: var(--cap-font);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--cap-radius-sm);
  transition: background 0.15s, opacity 0.15s;
}

.cap-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cap-btn--icon {
  background: none;
  color: inherit;
  padding: 4px 8px;
  font-size: 18px;
  line-height: 1;
  border-radius: 4px;
}

.cap-btn--icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.cap-btn--send {
  background: var(--cap-btn-send);
  color: #ffffff;
  padding: 8px 12px;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.cap-btn--send:hover:not(:disabled) {
  background: var(--cap-btn-send-hover);
}

.cap-btn--commit {
  background: var(--cap-btn-commit);
  color: #ffffff;
  padding: 6px 14px;
}

.cap-btn--commit:hover:not(:disabled) {
  background: var(--cap-btn-commit-hover);
}

.cap-btn--discard {
  background: transparent;
  color: var(--cap-btn-discard);
  padding: 6px 14px;
  border: 1px solid var(--cap-btn-discard);
}

.cap-btn--discard:hover:not(:disabled) {
  background: var(--cap-btn-discard);
  color: #ffffff;
}

/* --------------- Input --------------- */
.cap-input {
  flex: 1;
  resize: none;
  border: 1px solid var(--cap-input-border);
  border-radius: var(--cap-radius-sm);
  padding: 8px 12px;
  font-family: var(--cap-font);
  font-size: var(--cap-font-size);
  line-height: 1.5;
  outline: none;
  min-height: 38px;
  max-height: 120px;
  transition: border-color 0.15s;
}

.cap-input:focus {
  border-color: var(--cap-input-focus);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.cap-input:disabled {
  opacity: 0.6;
  background: #f8fafc;
}

/* --------------- Empty State --------------- */
.cap-empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.cap-empty-state__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px;
  color: #64748b;
}

.cap-empty-state__hint {
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

/* --------------- Error --------------- */
.cap-error {
  background: var(--cap-error-bg);
  color: var(--cap-error-text);
  padding: 8px 12px;
  border-radius: var(--cap-radius-sm);
  font-size: 13px;
}

.cap-error p {
  margin: 0;
}

/* --------------- Loading Dots --------------- */
.cap-loading-dots {
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
}

.cap-loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  animation: cap-dot-bounce 1.4s infinite ease-in-out both;
}

.cap-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.cap-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.cap-loading-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes cap-dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* --------------- Toggle FAB --------------- */
.cap-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--cap-toggle-bg);
  color: var(--cap-toggle-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 99997;
  transition: background 0.15s, transform 0.15s;
}

.cap-toggle:hover {
  background: var(--cap-toggle-hover);
  transform: scale(1.05);
}

.cap-toggle--active {
  background: var(--cap-header-bg);
}

.cap-toggle--active:hover {
  background: #2a2a4e;
}

.cap-toggle__icon {
  width: 24px;
  height: 24px;
}

.cap-toggle__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--cap-badge-bg);
  color: var(--cap-badge-text);
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  font-family: var(--cap-font);
}

/* --------------- Responsive --------------- */
@media (max-width: 480px) {
  .cap-panel {
    width: 100vw;
  }

  .cap-toggle {
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }

  .cap-toggle__icon {
    width: 20px;
    height: 20px;
  }
}

/* --------------- Section Inspector --------------- */

/* Full-page transparent overlay — blocks page interactions during inspect */
.cap-inspector-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  cursor: crosshair;
}

/* Blue highlight box drawn around the hovered section */
.cap-inspector-highlight {
  position: fixed;
  z-index: 100001;
  border: 2px solid #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  pointer-events: none;
  transition: top 0.1s ease, left 0.1s ease, width 0.1s ease, height 0.1s ease;
  box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.15);
}

/* Label tooltip attached to the top-left of the highlight */
.cap-inspector-label {
  position: absolute;
  top: -28px;
  left: -2px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #3b82f6;
  color: #ffffff;
  font-family: var(--cap-font);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px 4px 0 0;
  white-space: nowrap;
  pointer-events: none;
  line-height: 1.4;
}

/* If the section is near the top of viewport, show label inside instead */
.cap-inspector-highlight[style*="top: 0"] .cap-inspector-label,
.cap-inspector-highlight[style*="top: 1"] .cap-inspector-label {
  top: 2px;
  border-radius: 0 0 4px 0;
}

.cap-inspector-label__entity {
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 10px;
  text-transform: lowercase;
}

.cap-inspector-label__name {
  font-weight: 500;
}

/* Instruction bar at the top of the page */
.cap-inspector-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100002;
  background: #1e293b;
  color: #e2e8f0;
  font-family: var(--cap-font);
  font-size: 13px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: cap-slide-down 0.2s ease;
}

@keyframes cap-slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

.cap-inspector-bar__icon {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.cap-inspector-bar kbd {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 3px;
  padding: 1px 6px;
  font-family: monospace;
  font-size: 12px;
  color: #f1f5f9;
}

/* --------------- Selected Section Badge (in panel) --------------- */
.cap-section-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #eff6ff;
  border-bottom: 1px solid var(--cap-panel-border);
  font-family: var(--cap-font);
  font-size: 12px;
  color: #1e40af;
  flex-shrink: 0;
}

.cap-section-badge__icon {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.cap-section-badge__entity {
  font-family: monospace;
  font-weight: 600;
  background: #dbeafe;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.cap-section-badge__label {
  color: #3b82f6;
  font-weight: 500;
}

.cap-section-badge__clear {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  font-family: var(--cap-font);
  border-radius: 3px;
}

.cap-section-badge__clear:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* --------------- Inspect button in header --------------- */
.cap-btn--inspect {
  background: none;
  color: inherit;
  padding: 4px 8px;
  font-size: 16px;
  line-height: 1;
  border-radius: 4px;
  position: relative;
}

.cap-btn--inspect:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.cap-btn--inspect--active {
  background: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.cap-btn--inspect--active:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.4);
}

/* --------------- Preview Toggle Button (in commit toolbar) --------------- */
.cap-btn--preview {
  background: none;
  color: #64748b;
  padding: 4px 6px;
  line-height: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cap-btn--preview:hover:not(:disabled) {
  background: #f1f5f9;
  color: #334155;
}

.cap-btn--preview--active {
  color: #3b82f6;
}

.cap-btn--preview--active:hover:not(:disabled) {
  background: #eff6ff;
  color: #2563eb;
}

/* --------------- Preview Banner --------------- */
.cap-preview-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99996;
  font-family: var(--cap-font);
  font-size: 13px;
  animation: cap-slide-down 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cap-preview-banner--active {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: #ffffff;
}

.cap-preview-banner--paused {
  background: #fefce8;
  color: #713f12;
  border-bottom: 1px solid #fde047;
}

.cap-preview-banner__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  max-width: 100%;
}

.cap-preview-banner__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cap-preview-banner__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cap-preview-banner--active .cap-preview-banner__dot {
  background: #86efac;
  animation: cap-pulse 2s infinite;
}

.cap-preview-banner--paused .cap-preview-banner__dot {
  background: #facc15;
}

@keyframes cap-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.cap-preview-banner__text {
  font-weight: 500;
}

.cap-preview-banner__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cap-preview-banner__btn {
  border: none;
  cursor: pointer;
  font-family: var(--cap-font);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
  transition: background 0.15s, opacity 0.15s;
}

.cap-preview-banner__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cap-preview-banner--active .cap-preview-banner__btn--toggle {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.cap-preview-banner--active .cap-preview-banner__btn--toggle:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.cap-preview-banner--paused .cap-preview-banner__btn--toggle {
  background: #fef08a;
  color: #713f12;
}

.cap-preview-banner--paused .cap-preview-banner__btn--toggle:hover:not(:disabled) {
  background: #fde047;
}

.cap-preview-banner--active .cap-preview-banner__btn--discard {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.cap-preview-banner--active .cap-preview-banner__btn--discard:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.cap-preview-banner--paused .cap-preview-banner__btn--discard {
  background: transparent;
  color: #92400e;
  border: 1px solid #d97706;
}

.cap-preview-banner--paused .cap-preview-banner__btn--discard:hover:not(:disabled) {
  background: #fef3c7;
}

.cap-preview-banner--active .cap-preview-banner__btn--commit {
  background: #22c55e;
  color: #ffffff;
}

.cap-preview-banner--active .cap-preview-banner__btn--commit:hover:not(:disabled) {
  background: #16a34a;
}

.cap-preview-banner--paused .cap-preview-banner__btn--commit {
  background: #22c55e;
  color: #ffffff;
}

.cap-preview-banner--paused .cap-preview-banner__btn--commit:hover:not(:disabled) {
  background: #16a34a;
}

/* --------------- Preview Section Highlight --------------- */
.cap-preview-highlight {
  outline: 2px dashed #3b82f6;
  outline-offset: 2px;
  position: relative;
  transition: outline-color 0.3s ease;
}

.cap-preview-highlight::before {
  content: attr(data-cap-preview-label);
  position: absolute;
  top: -22px;
  left: -2px;
  background: #3b82f6;
  color: #ffffff;
  font-family: var(--cap-font);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px 3px 0 0;
  white-space: nowrap;
  z-index: 1;
}

/* Responsive adjustments for preview banner */
@media (max-width: 600px) {
  .cap-preview-banner__content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .cap-preview-banner__actions {
    justify-content: center;
  }
}
`;
  document.head.appendChild(style);

// ============================================================
// CMS Agent Panel — Vanilla JS Implementation
// Replicates the React @fvargas/cms-agent-panel without any
// framework dependency. Designed for static HTML sites served
// by nginx (executive-catering, 1stopwings).
//
// Exposes window.CmsAgentPanel with an init() method.
// ============================================================

// --------------- GraphQL Operations ---------------

var AGENT_CHAT_MUTATION = '\
  mutation AgentChat($input: AgentChatInput!) {\
    agentChat(input: $input) {\
      message\
      sessionId\
      proposedChanges {\
        id entityType recordId fieldPath oldValue newValue description\
      }\
    }\
  }';

var AGENT_COMMIT_MUTATION = '\
  mutation AgentCommit($input: AgentCommitInput!) {\
    agentCommit(input: $input) {\
      success\
      results { changeId success error }\
      error\
    }\
  }';

var LOGIN_MUTATION = '\
  mutation Login($input: LoginInput!) {\
    login(input: $input) {\
      success\
      token\
      user { id username role }\
      portfolios { id slug name }\
      errorMessage\
    }\
  }';

// --------------- State ---------------

var state = {
  isOpen: false,
  messages: [],          // { id, role, content, timestamp, proposedChanges? }
  proposedChanges: [],   // { id, entityType, recordId, fieldPath, oldValue, newValue, description }
  sessionId: null,
  isLoading: false,
  error: null,
  isInspecting: false,
  selectedSection: null, // { selector, entityType, label }
  isPreviewActive: true,
  toolbarExpanded: false
};

var config = {
  graphqlUrl: '/graphql',
  wsUrl: null,
  token: null,
  portfolioId: null,
  sections: [],
  onPreviewChange: null,  // callback(proposedChanges) — for host to apply preview
  onCommitted: null,      // callback() — for host to refetch content
  onDiscard: null          // callback() — for host to restore original content
};

var els = {}; // DOM element references

// --------------- Utilities ---------------

function uid(prefix) {
  return (prefix || 'cap') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function esc(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --------------- GraphQL Client ---------------

function buildHeaders() {
  var headers = { 'Content-Type': 'application/json' };
  if (config.token) headers['Authorization'] = 'Bearer ' + config.token;
  if (config.portfolioId) headers['X-Portfolio-ID'] = config.portfolioId;
  return headers;
}

function gqlFetch(query, variables) {
  return fetch(config.graphqlUrl, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ query: query, variables: variables || {} })
  })
    .then(function(res) {
      if (!res.ok) throw new Error('GraphQL request failed: ' + res.status);
      return res.json();
    })
    .then(function(json) {
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function(e) { return e.message; }).join('; '));
      }
      return json.data;
    });
}

function sendAgentMessage(message, history, sessionId) {
  var conversationHistory = history
    .filter(function(m) { return m.role === 'user' || m.role === 'assistant'; })
    .map(function(m) { return { role: m.role, content: m.content }; });

  return gqlFetch(AGENT_CHAT_MUTATION, {
    input: { message: message, conversationHistory: conversationHistory, sessionId: sessionId }
  }).then(function(data) {
    return data.agentChat;
  });
}

function commitChanges(changes) {
  return gqlFetch(AGENT_COMMIT_MUTATION, {
    input: {
      changes: changes.map(function(c) {
        return {
          id: c.id, entityType: c.entityType, recordId: c.recordId,
          fieldPath: c.fieldPath, oldValue: c.oldValue, newValue: c.newValue,
          description: c.description
        };
      })
    }
  }).then(function(data) {
    return data.agentCommit;
  });
}

function loginAgent(username, password) {
  return fetch(config.graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { input: { username: username, password: password } }
    })
  })
    .then(function(res) {
      if (!res.ok) throw new Error('Login request failed: ' + res.status);
      return res.json();
    })
    .then(function(json) {
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function(e) { return e.message; }).join('; '));
      }
      return json.data.login;
    });
}

// --------------- Markdown Renderer ---------------

function parseInlineMarkdown(text) {
  // Order: inline code, bold+italic, bold, italic, links
  return text
    .replace(/`([^`]+)`/g, '<code class="cap-md-code">$1</code>')
    .replace(/\*{3}([^*]+?)\*{3}/g, '<strong class="cap-md-bold"><em class="cap-md-italic">$1</em></strong>')
    .replace(/\*{2}([^*]+?)\*{2}/g, '<strong class="cap-md-bold">$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em class="cap-md-italic">$1</em>')
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a class="cap-md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdown(content) {
  var lines = content.split('\n');
  var html = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      var lang = line.trimStart().slice(3).trim();
      var codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(esc(lines[i]));
        i++;
      }
      i++; // skip closing ```
      var langClass = lang ? ' cap-md-lang-' + esc(lang) : '';
      html.push('<pre class="cap-md-pre"><code class="cap-md-codeblock' + langClass + '">' + codeLines.join('\n') + '</code></pre>');
      continue;
    }

    // Heading
    var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      html.push('<h' + level + ' class="cap-md-heading cap-md-h' + level + '">' + parseInlineMarkdown(esc(headingMatch[2])) + '</h' + level + '>');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      html.push('<hr class="cap-md-hr">');
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s+/.test(line)) {
      var items = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        var itemText = lines[i].replace(/^[\s]*[-*+]\s+/, '');
        items.push('<li>' + parseInlineMarkdown(esc(itemText)) + '</li>');
        i++;
      }
      html.push('<ul class="cap-md-ul">' + items.join('') + '</ul>');
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+[.)]\s+/.test(line)) {
      var items = [];
      while (i < lines.length && /^[\s]*\d+[.)]\s+/.test(lines[i])) {
        var itemText = lines[i].replace(/^[\s]*\d+[.)]\s+/, '');
        items.push('<li>' + parseInlineMarkdown(esc(itemText)) + '</li>');
        i++;
      }
      html.push('<ol class="cap-md-ol">' + items.join('') + '</ol>');
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    var paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^[\s]*[-*+]\s+/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html.push('<p class="cap-md-p">' + parseInlineMarkdown(esc(paraLines.join('\n'))) + '</p>');
    }
  }

  return '<div class="cap-md">' + html.join('') + '</div>';
}

// --------------- DOM Construction ---------------

function buildPanel() {
  // FAB toggle button
  els.toggle = document.createElement('button');
  els.toggle.className = 'cap-toggle';
  els.toggle.setAttribute('aria-label', 'Open CMS Agent');
  els.toggle.setAttribute('title', 'Open CMS Agent');
  els.toggle.innerHTML =
    '<svg class="cap-toggle__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
    '</svg>';
  els.toggle.addEventListener('click', togglePanel);

  // Badge (for pending changes count)
  els.badge = document.createElement('span');
  els.badge.className = 'cap-toggle__badge';
  els.badge.style.display = 'none';
  els.toggle.appendChild(els.badge);

  // Backdrop
  els.backdrop = document.createElement('div');
  els.backdrop.className = 'cap-backdrop';
  els.backdrop.style.display = 'none';
  els.backdrop.addEventListener('click', closePanel);

  // Panel
  els.panel = document.createElement('div');
  els.panel.className = 'cap-panel';

  // Header
  var header = document.createElement('div');
  header.className = 'cap-panel__header';
  var title = document.createElement('h3');
  title.className = 'cap-panel__title';
  title.textContent = 'CMS Agent';
  header.appendChild(title);

  var headerActions = document.createElement('div');
  headerActions.className = 'cap-panel__header-actions';

  // Inspect button (only if sections configured)
  if (config.sections && config.sections.length > 0) {
    els.inspectBtn = document.createElement('button');
    els.inspectBtn.className = 'cap-btn cap-btn--inspect';
    els.inspectBtn.setAttribute('title', 'Inspect section');
    els.inspectBtn.setAttribute('aria-label', 'Inspect section');
    els.inspectBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="12" y1="2" x2="12" y2="6"/>' +
      '<line x1="12" y1="18" x2="12" y2="22"/>' +
      '<line x1="2" y1="12" x2="6" y2="12"/>' +
      '<line x1="18" y1="12" x2="22" y2="12"/>' +
      '</svg>';
    els.inspectBtn.addEventListener('click', toggleInspect);
    headerActions.appendChild(els.inspectBtn);
  }

  // New conversation button
  var newBtn = document.createElement('button');
  newBtn.className = 'cap-btn cap-btn--icon';
  newBtn.setAttribute('title', 'New conversation');
  newBtn.setAttribute('aria-label', 'New conversation');
  newBtn.innerHTML = '&#x21bb;';
  newBtn.addEventListener('click', clearSession);
  headerActions.appendChild(newBtn);

  // Close button
  var closeBtn = document.createElement('button');
  closeBtn.className = 'cap-btn cap-btn--icon';
  closeBtn.setAttribute('title', 'Close panel');
  closeBtn.setAttribute('aria-label', 'Close panel');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closePanel);
  headerActions.appendChild(closeBtn);

  header.appendChild(headerActions);
  els.panel.appendChild(header);

  // Section badge (hidden by default)
  els.sectionBadge = document.createElement('div');
  els.sectionBadge.className = 'cap-section-badge';
  els.sectionBadge.style.display = 'none';
  els.panel.appendChild(els.sectionBadge);

  // Messages area
  els.messages = document.createElement('div');
  els.messages.className = 'cap-panel__messages';
  els.panel.appendChild(els.messages);

  // Commit toolbar (hidden by default)
  els.commitToolbar = document.createElement('div');
  els.commitToolbar.className = 'cap-commit-toolbar';
  els.commitToolbar.style.display = 'none';
  els.panel.appendChild(els.commitToolbar);

  // Input area
  els.inputArea = document.createElement('div');
  els.inputArea.className = 'cap-panel__input';
  els.input = document.createElement('textarea');
  els.input.className = 'cap-input';
  els.input.setAttribute('placeholder', 'Ask me to edit your content...');
  els.input.setAttribute('rows', '1');
  els.input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  els.inputArea.appendChild(els.input);

  els.sendBtn = document.createElement('button');
  els.sendBtn.className = 'cap-btn cap-btn--send';
  els.sendBtn.setAttribute('aria-label', 'Send message');
  els.sendBtn.innerHTML = '&#x27A4;';
  els.sendBtn.addEventListener('click', handleSend);
  els.inputArea.appendChild(els.sendBtn);
  els.panel.appendChild(els.inputArea);

  // Preview banner (fixed at top, hidden by default)
  els.previewBanner = document.createElement('div');
  els.previewBanner.className = 'cap-preview-banner cap-preview-banner--active';
  els.previewBanner.style.display = 'none';
  els.previewBanner.innerHTML =
    '<div class="cap-preview-banner__content">' +
      '<div class="cap-preview-banner__status">' +
        '<span class="cap-preview-banner__dot"></span>' +
        '<span class="cap-preview-banner__text"></span>' +
      '</div>' +
      '<div class="cap-preview-banner__actions">' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--toggle">Pause</button>' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--discard">Discard</button>' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--commit">Commit All</button>' +
      '</div>' +
    '</div>';

  // Inspector elements (created on demand)
  els.inspectorOverlay = null;
  els.inspectorHighlight = null;
  els.inspectorBar = null;

  // Mount to DOM
  document.body.appendChild(els.toggle);
  document.body.appendChild(els.backdrop);
  document.body.appendChild(els.panel);
  document.body.appendChild(els.previewBanner);

  // Wire preview banner buttons
  els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').addEventListener('click', togglePreview);
  els.previewBanner.querySelector('.cap-preview-banner__btn--discard').addEventListener('click', function() { discardChanges(); });
  els.previewBanner.querySelector('.cap-preview-banner__btn--commit').addEventListener('click', function() { doCommit(); });
}

// --------------- Actions ---------------

function togglePanel() {
  state.isOpen = !state.isOpen;
  renderPanelState();
  if (state.isOpen) {
    setTimeout(function() { els.input.focus(); }, 300);
  }
}

function closePanel() {
  state.isOpen = false;
  renderPanelState();
}

function openPanel() {
  state.isOpen = true;
  renderPanelState();
  setTimeout(function() { els.input.focus(); }, 300);
}

function clearSession() {
  state.messages = [];
  state.proposedChanges = [];
  state.sessionId = null;
  state.isLoading = false;
  state.error = null;
  state.isInspecting = false;
  state.selectedSection = null;
  state.isPreviewActive = true;
  state.toolbarExpanded = false;
  teardownInspector();
  renderMessages();
  renderCommitToolbar();
  renderPreviewBanner();
  renderSectionBadge();
  if (config.onDiscard) config.onDiscard();
}

function toggleInspect() {
  state.isInspecting = !state.isInspecting;
  if (state.isInspecting) {
    setupInspector();
  } else {
    teardownInspector();
  }
  renderInspectButton();
}

function selectSection(section) {
  state.selectedSection = section;
  state.isInspecting = false;
  teardownInspector();
  renderSectionBadge();
  renderInspectButton();
  // Open panel when a section is selected
  if (section && !state.isOpen) {
    openPanel();
  }
}

function togglePreview() {
  state.isPreviewActive = !state.isPreviewActive;
  renderPreviewBanner();
  // Notify host
  if (state.isPreviewActive && state.proposedChanges.length > 0) {
    if (config.onPreviewChange) config.onPreviewChange(state.proposedChanges);
  } else if (!state.isPreviewActive) {
    if (config.onDiscard) config.onDiscard();
  }
}

function handleSend() {
  var text = els.input.value.trim();
  if (!text || state.isLoading || !config.token) return;

  els.input.value = '';

  var userMsg = {
    id: uid('user'),
    role: 'user',
    content: text,
    timestamp: new Date()
  };

  state.messages.push(userMsg);
  state.isLoading = true;
  state.error = null;
  renderMessages();
  renderInputState();

  // Prepend section context
  var contextualContent = text;
  if (state.selectedSection) {
    contextualContent = '[Section: ' + state.selectedSection.entityType + '] ' + text;
  }

  sendAgentMessage(contextualContent, state.messages, state.sessionId)
    .then(function(response) {
      var assistantMsg = {
        id: uid('assistant'),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        proposedChanges: response.proposedChanges.length > 0 ? response.proposedChanges : undefined
      };

      state.messages.push(assistantMsg);
      state.sessionId = response.sessionId;
      state.isLoading = false;

      if (response.proposedChanges.length > 0) {
        state.proposedChanges = state.proposedChanges.concat(response.proposedChanges);
        if (config.onPreviewChange && state.isPreviewActive) {
          config.onPreviewChange(state.proposedChanges);
        }
      }

      renderMessages();
      renderInputState();
      renderCommitToolbar();
      renderPreviewBanner();
      renderBadge();
    })
    .catch(function(err) {
      state.error = err.message || 'Failed to send message';
      state.isLoading = false;
      renderMessages();
      renderInputState();
    });
}

function doCommit() {
  if (state.proposedChanges.length === 0 || state.isLoading) return;
  state.isLoading = true;
  renderCommitToolbar();
  renderPreviewBanner();
  renderInputState();

  commitChanges(state.proposedChanges)
    .then(function(result) {
      state.isLoading = false;
      if (result.success) {
        var count = result.results.filter(function(r) { return r.success; }).length;
        state.proposedChanges = [];

        state.messages.push({
          id: uid('system'),
          role: 'system',
          content: 'Committed ' + count + ' change' + (count !== 1 ? 's' : '') + ' successfully. The page content has been updated.',
          timestamp: new Date()
        });

        if (config.onCommitted) config.onCommitted();
      } else {
        var errorMsg = result.error || 'Commit failed';
        state.error = errorMsg;
        state.messages.push({
          id: uid('system-error'),
          role: 'system',
          content: 'Commit failed: ' + errorMsg,
          timestamp: new Date()
        });
      }

      renderMessages();
      renderCommitToolbar();
      renderPreviewBanner();
      renderBadge();
      renderInputState();
    })
    .catch(function(err) {
      state.isLoading = false;
      state.error = err.message || 'Failed to commit changes';
      state.messages.push({
        id: uid('system-error'),
        role: 'system',
        content: 'Commit failed: ' + (err.message || 'Unknown error'),
        timestamp: new Date()
      });
      renderMessages();
      renderCommitToolbar();
      renderPreviewBanner();
      renderInputState();
    });
}

function discardChanges() {
  var count = state.proposedChanges.length;
  if (count === 0) return;

  state.proposedChanges = [];

  state.messages.push({
    id: uid('system'),
    role: 'system',
    content: 'Discarded ' + count + ' pending change' + (count !== 1 ? 's' : '') + '. The page is showing the original content.',
    timestamp: new Date()
  });

  if (config.onDiscard) config.onDiscard();

  renderMessages();
  renderCommitToolbar();
  renderPreviewBanner();
  renderBadge();
}

// --------------- Section Inspector ---------------

var inspectorMouseMove = null;
var inspectorClick = null;
var inspectorKeyDown = null;
var inspectorMatchedSection = null;

function setupInspector() {
  // Overlay
  els.inspectorOverlay = document.createElement('div');
  els.inspectorOverlay.className = 'cap-inspector-overlay';
  document.body.appendChild(els.inspectorOverlay);

  // Highlight
  els.inspectorHighlight = document.createElement('div');
  els.inspectorHighlight.className = 'cap-inspector-highlight';
  els.inspectorHighlight.style.display = 'none';
  els.inspectorHighlight.innerHTML =
    '<div class="cap-inspector-label">' +
      '<span class="cap-inspector-label__entity"></span>' +
      '<span class="cap-inspector-label__name"></span>' +
    '</div>';
  document.body.appendChild(els.inspectorHighlight);

  // Instruction bar
  els.inspectorBar = document.createElement('div');
  els.inspectorBar.className = 'cap-inspector-bar';
  els.inspectorBar.innerHTML =
    '<span class="cap-inspector-bar__icon">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<line x1="12" y1="2" x2="12" y2="6"/>' +
        '<line x1="12" y1="18" x2="12" y2="22"/>' +
        '<line x1="2" y1="12" x2="6" y2="12"/>' +
        '<line x1="18" y1="12" x2="22" y2="12"/>' +
      '</svg>' +
    '</span>' +
    'Select a section to provide context &middot; Press <kbd>Esc</kbd> to cancel';
  document.body.appendChild(els.inspectorBar);

  // Hide backdrop during inspect
  els.backdrop.style.display = 'none';

  // Event handlers
  inspectorMouseMove = function(e) {
    var match = findSectionAt(e.clientX, e.clientY);
    inspectorMatchedSection = match;
    if (match) {
      var rect = match.el.getBoundingClientRect();
      els.inspectorHighlight.style.display = 'block';
      els.inspectorHighlight.style.top = rect.top + 'px';
      els.inspectorHighlight.style.left = rect.left + 'px';
      els.inspectorHighlight.style.width = rect.width + 'px';
      els.inspectorHighlight.style.height = rect.height + 'px';
      els.inspectorHighlight.querySelector('.cap-inspector-label__entity').textContent = match.descriptor.entityType;
      els.inspectorHighlight.querySelector('.cap-inspector-label__name').textContent = match.descriptor.label;
    } else {
      els.inspectorHighlight.style.display = 'none';
    }
  };

  inspectorClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (inspectorMatchedSection) {
      selectSection(inspectorMatchedSection.descriptor);
    } else {
      selectSection(null);
    }
  };

  inspectorKeyDown = function(e) {
    if (e.key === 'Escape') {
      selectSection(null);
    }
  };

  document.addEventListener('mousemove', inspectorMouseMove, true);
  document.addEventListener('click', inspectorClick, true);
  document.addEventListener('keydown', inspectorKeyDown, true);
}

function teardownInspector() {
  if (inspectorMouseMove) {
    document.removeEventListener('mousemove', inspectorMouseMove, true);
    document.removeEventListener('click', inspectorClick, true);
    document.removeEventListener('keydown', inspectorKeyDown, true);
    inspectorMouseMove = null;
    inspectorClick = null;
    inspectorKeyDown = null;
    inspectorMatchedSection = null;
  }
  if (els.inspectorOverlay) {
    els.inspectorOverlay.remove();
    els.inspectorOverlay = null;
  }
  if (els.inspectorHighlight) {
    els.inspectorHighlight.remove();
    els.inspectorHighlight = null;
  }
  if (els.inspectorBar) {
    els.inspectorBar.remove();
    els.inspectorBar = null;
  }
}

function findSectionAt(x, y) {
  if (!config.sections || config.sections.length === 0) return null;
  var best = null;
  for (var i = 0; i < config.sections.length; i++) {
    var desc = config.sections[i];
    var nodeList = document.querySelectorAll(desc.selector);
    for (var j = 0; j < nodeList.length; j++) {
      var el = nodeList[j];
      var rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        var area = rect.width * rect.height;
        if (!best || area < best.area) {
          best = { el: el, descriptor: desc, area: area };
        }
      }
    }
  }
  return best ? { el: best.el, descriptor: best.descriptor } : null;
}

// --------------- Rendering ---------------

function renderPanelState() {
  if (state.isOpen) {
    els.panel.classList.add('cap-panel--open');
    els.toggle.classList.add('cap-toggle--active');
    els.toggle.setAttribute('aria-label', 'Close CMS Agent');
    els.toggle.setAttribute('title', 'Close CMS Agent');
    if (!state.isInspecting) {
      els.backdrop.style.display = 'block';
    }
  } else {
    els.panel.classList.remove('cap-panel--open');
    els.toggle.classList.remove('cap-toggle--active');
    els.toggle.setAttribute('aria-label', 'Open CMS Agent');
    els.toggle.setAttribute('title', 'Open CMS Agent');
    els.backdrop.style.display = 'none';
  }
}

function renderMessages() {
  var html = '';

  if (state.messages.length === 0) {
    html =
      '<div class="cap-empty-state">' +
        '<p class="cap-empty-state__title">Ask me to edit your content</p>' +
        '<p class="cap-empty-state__hint">Try: &quot;Change the hero title to Welcome&quot; or &quot;Update the about section description&quot;</p>' +
      '</div>';
  } else {
    for (var i = 0; i < state.messages.length; i++) {
      html += renderMessageBubble(state.messages[i]);
    }
  }

  // Loading dots
  if (state.isLoading && state.messages.length > 0 && state.messages[state.messages.length - 1].role !== 'assistant') {
    html +=
      '<div class="cap-message cap-message--assistant">' +
        '<div class="cap-message__bubble cap-message__bubble--loading">' +
          '<span class="cap-loading-dots"><span></span><span></span><span></span></span>' +
        '</div>' +
      '</div>';
  }

  // Error
  if (state.error) {
    html += '<div class="cap-error"><p>' + esc(state.error) + '</p></div>';
  }

  html += '<div id="cap-messages-end"></div>';
  els.messages.innerHTML = html;

  // Auto-scroll
  var end = els.messages.querySelector('#cap-messages-end');
  if (end) end.scrollIntoView({ behavior: 'smooth' });
}

function renderMessageBubble(msg) {
  var isUser = msg.role === 'user';
  var isSystem = msg.role === 'system';
  var roleClass = isSystem ? 'system' : isUser ? 'user' : 'assistant';
  var contentHtml = isSystem
    ? '<p class="cap-message__text">' + esc(msg.content) + '</p>'
    : renderMarkdown(msg.content);

  var changesHtml = '';
  if (msg.proposedChanges && msg.proposedChanges.length > 0) {
    changesHtml = '<div class="cap-changes-inline">';
    for (var i = 0; i < msg.proposedChanges.length; i++) {
      changesHtml += renderChangeCard(msg.proposedChanges[i], true);
    }
    changesHtml += '</div>';
  }

  return (
    '<div class="cap-message cap-message--' + roleClass + '">' +
      '<div class="cap-message__bubble">' +
        contentHtml +
        changesHtml +
      '</div>' +
    '</div>'
  );
}

function renderChangeCard(change, compact) {
  var cls = 'cap-change-card' + (compact ? ' cap-change-card--compact' : '');
  var descHtml = (!compact && change.description)
    ? '<p class="cap-change-card__desc">' + esc(change.description) + '</p>'
    : '';

  return (
    '<div class="' + cls + '">' +
      '<div class="cap-change-card__header">' +
        '<span class="cap-change-card__entity">' + esc(change.entityType) + '</span>' +
        '<span class="cap-change-card__field">' + esc(change.fieldPath) + '</span>' +
      '</div>' +
      '<div class="cap-change-card__diff">' +
        '<div class="cap-change-card__old">' +
          '<span class="cap-change-card__label">Before:</span>' +
          '<span class="cap-change-card__value">' + esc(change.oldValue || '(empty)') + '</span>' +
        '</div>' +
        '<div class="cap-change-card__new">' +
          '<span class="cap-change-card__label">After:</span>' +
          '<span class="cap-change-card__value">' + esc(change.newValue) + '</span>' +
        '</div>' +
      '</div>' +
      descHtml +
    '</div>'
  );
}

function renderCommitToolbar() {
  if (state.proposedChanges.length === 0) {
    els.commitToolbar.style.display = 'none';
    return;
  }

  els.commitToolbar.style.display = 'block';

  var arrow = state.toolbarExpanded ? '\u25BC' : '\u25B6';
  var count = state.proposedChanges.length;
  var previewActiveClass = state.isPreviewActive ? ' cap-btn--preview--active' : '';

  var eyeIcon = state.isPreviewActive
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
      '<line x1="1" y1="1" x2="23" y2="23"/>';

  var html =
    '<div class="cap-commit-toolbar__summary">' +
      '<button class="cap-commit-toolbar__toggle" aria-label="Toggle change details">' +
        arrow + ' ' + count + ' pending change' + (count !== 1 ? 's' : '') +
      '</button>' +
      '<div class="cap-commit-toolbar__actions">' +
        '<button class="cap-btn cap-btn--preview' + previewActiveClass + '" ' +
          'title="' + (state.isPreviewActive ? 'Pause live preview' : 'Resume live preview') + '" ' +
          'aria-label="' + (state.isPreviewActive ? 'Pause live preview' : 'Resume live preview') + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          eyeIcon +
          '</svg>' +
        '</button>' +
        '<button class="cap-btn cap-btn--discard"' + (state.isLoading ? ' disabled' : '') + '>Discard</button>' +
        '<button class="cap-btn cap-btn--commit"' + (state.isLoading ? ' disabled' : '') + '>' +
          (state.isLoading ? 'Committing...' : 'Commit All') +
        '</button>' +
      '</div>' +
    '</div>';

  if (state.toolbarExpanded) {
    html += '<div class="cap-commit-toolbar__details">';
    for (var i = 0; i < state.proposedChanges.length; i++) {
      html += renderChangeCard(state.proposedChanges[i], false);
    }
    html += '</div>';
  }

  els.commitToolbar.innerHTML = html;

  // Wire events
  els.commitToolbar.querySelector('.cap-commit-toolbar__toggle').addEventListener('click', function() {
    state.toolbarExpanded = !state.toolbarExpanded;
    renderCommitToolbar();
  });
  els.commitToolbar.querySelector('.cap-btn--preview').addEventListener('click', togglePreview);
  els.commitToolbar.querySelector('.cap-btn--discard').addEventListener('click', function() { discardChanges(); });
  els.commitToolbar.querySelector('.cap-btn--commit').addEventListener('click', function() { doCommit(); });
}

function renderPreviewBanner() {
  if (state.proposedChanges.length === 0) {
    els.previewBanner.style.display = 'none';
    return;
  }

  els.previewBanner.style.display = 'block';
  var count = state.proposedChanges.length;

  if (state.isPreviewActive) {
    els.previewBanner.className = 'cap-preview-banner cap-preview-banner--active';
    els.previewBanner.querySelector('.cap-preview-banner__text').textContent =
      'Preview Mode \u2014 ' + count + ' pending change' + (count !== 1 ? 's' : '');
    els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').textContent = 'Pause';
  } else {
    els.previewBanner.className = 'cap-preview-banner cap-preview-banner--paused';
    els.previewBanner.querySelector('.cap-preview-banner__text').textContent =
      'Preview Paused \u2014 ' + count + ' pending change' + (count !== 1 ? 's' : '') + ' (showing original content)';
    els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').textContent = 'Resume';
  }

  var commitBtn = els.previewBanner.querySelector('.cap-preview-banner__btn--commit');
  commitBtn.textContent = state.isLoading ? 'Committing...' : 'Commit All';
  commitBtn.disabled = state.isLoading;
  els.previewBanner.querySelector('.cap-preview-banner__btn--discard').disabled = state.isLoading;
}

function renderBadge() {
  var count = state.proposedChanges.length;
  if (count > 0) {
    els.badge.textContent = count;
    els.badge.style.display = 'flex';
  } else {
    els.badge.style.display = 'none';
  }
}

function renderSectionBadge() {
  if (!state.selectedSection) {
    els.sectionBadge.style.display = 'none';
    return;
  }

  els.sectionBadge.style.display = 'flex';
  els.sectionBadge.innerHTML =
    '<span class="cap-section-badge__icon">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="10" r="3"/>' +
        '<path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z"/>' +
      '</svg>' +
    '</span>' +
    '<span class="cap-section-badge__label">Focused on:</span>' +
    '<span class="cap-section-badge__entity">' + esc(state.selectedSection.entityType) + '</span>' +
    '<span>' + esc(state.selectedSection.label) + '</span>' +
    '<button class="cap-section-badge__clear" title="Clear section focus" aria-label="Clear section focus">&times;</button>';

  els.sectionBadge.querySelector('.cap-section-badge__clear').addEventListener('click', function() {
    selectSection(null);
  });
}

function renderInspectButton() {
  if (!els.inspectBtn) return;
  if (state.isInspecting) {
    els.inspectBtn.classList.add('cap-btn--inspect--active');
  } else {
    els.inspectBtn.classList.remove('cap-btn--inspect--active');
  }
}

function renderInputState() {
  els.input.disabled = state.isLoading;
  els.sendBtn.disabled = state.isLoading || !els.input.value.trim();
}

// --------------- Preview Mechanism for Static Sites ---------------

/**
 * Apply proposed changes directly to the DOM using data-cms attributes.
 * This is the static-site equivalent of the React PreviewProvider.
 *
 * For each proposed change, the fieldPath is expected to match a data-cms attribute
 * or use the format "entityType.fieldName" where we look up the section element.
 */
var originalValues = {}; // key -> original textContent/innerHTML

function applyPreviewToDOM(changes) {
  // Iterate changes and try to apply them to matching DOM elements
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    applyOneChange(change);
  }
}

function applyOneChange(change) {
  // Strategy 1: direct data-cms match on fieldPath
  var el = document.querySelector('[data-cms="' + change.fieldPath + '"]');
  if (el) {
    var key = change.fieldPath;
    if (!(key in originalValues)) {
      originalValues[key] = el.textContent;
    }
    try {
      var newVal = JSON.parse(change.newValue);
      el.textContent = newVal;
    } catch (e) {
      el.textContent = change.newValue;
    }
    return;
  }

  // Strategy 2: try entityType-fieldPath as data-cms key
  // e.g. entityType="hero", fieldPath="tagline" -> data-cms="hero-tagline"
  var cmsKey = change.entityType + '-' + change.fieldPath;
  el = document.querySelector('[data-cms="' + cmsKey + '"]');
  if (el) {
    var key = cmsKey;
    if (!(key in originalValues)) {
      originalValues[key] = el.textContent;
    }
    try {
      var newVal = JSON.parse(change.newValue);
      el.textContent = newVal;
    } catch (e) {
      el.textContent = change.newValue;
    }
    return;
  }

  // Strategy 3: try just fieldPath with common data-cms patterns
  // Some field paths might use dot notation like "hero.tagline"
  var dotParts = change.fieldPath.split('.');
  if (dotParts.length >= 2) {
    cmsKey = dotParts.join('-');
    el = document.querySelector('[data-cms="' + cmsKey + '"]');
    if (el) {
      var key = cmsKey;
      if (!(key in originalValues)) {
        originalValues[key] = el.textContent;
      }
      try {
        var newVal = JSON.parse(change.newValue);
        el.textContent = newVal;
      } catch (e) {
        el.textContent = change.newValue;
      }
    }
  }
}

function restoreOriginalDOM() {
  var keys = Object.keys(originalValues);
  for (var i = 0; i < keys.length; i++) {
    var el = document.querySelector('[data-cms="' + keys[i] + '"]');
    if (el) {
      el.textContent = originalValues[keys[i]];
    }
  }
  originalValues = {};
}

// --------------- Auth Check ---------------

function checkAuth() {
  var token = null;
  try {
    token = localStorage.getItem('cms_auth_token');
  } catch (e) {
    // localStorage not available
  }
  return token;
}

// --------------- Public API ---------------

window.CmsAgentPanel = {
  /**
   * Initialize the CMS Agent Panel on a static HTML site.
   *
   * @param {Object} opts
   * @param {string} opts.graphqlUrl - GraphQL endpoint (default: '/graphql')
   * @param {string} opts.wsUrl - WebSocket URL (optional, derived from graphqlUrl)
   * @param {string} opts.portfolioId - Portfolio ID for multi-tenant resolution
   * @param {Array} opts.sections - Array of { selector, entityType, label }
   * @param {Function} opts.onPreviewChange - Called with proposedChanges array when preview should update
   * @param {Function} opts.onCommitted - Called after successful commit (host should refetch content)
   * @param {Function} opts.onDiscard - Called when changes are discarded (host should restore original)
   */
  init: function(opts) {
    opts = opts || {};
    config.graphqlUrl = opts.graphqlUrl || '/graphql';
    config.wsUrl = opts.wsUrl || null;
    config.portfolioId = opts.portfolioId || null;
    config.sections = opts.sections || [];

    // Set up default preview callbacks using DOM-based preview if host doesn't provide its own
    config.onPreviewChange = opts.onPreviewChange || function(changes) {
      restoreOriginalDOM();
      applyPreviewToDOM(changes);
    };
    config.onCommitted = opts.onCommitted || function() {
      // Default: full page reload to get committed content
      originalValues = {};
      window.location.reload();
    };
    config.onDiscard = opts.onDiscard || function() {
      restoreOriginalDOM();
    };

    // Check for auth token — only build panel if token exists
    config.token = checkAuth();

    function tryBuild() {
      if (config.token) {
        buildPanel();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryBuild);
    } else {
      tryBuild();
    }

    // Poll for token changes (e.g. user logs in on /admin page and redirects back)
    if (!config.token) {
      var pollId = setInterval(function() {
        var t = checkAuth();
        if (t) {
          config.token = t;
          // Also pick up portfolio ID if stored
          try {
            var raw = localStorage.getItem('cms_selected_portfolio');
            if (raw) {
              var p = JSON.parse(raw);
              config.portfolioId = p.id;
            }
          } catch (e) {}
          clearInterval(pollId);
          buildPanel();
        }
      }, 2000);
    }
  },

  // Expose for programmatic control
  open: openPanel,
  close: closePanel,
  toggle: togglePanel
};


})();
