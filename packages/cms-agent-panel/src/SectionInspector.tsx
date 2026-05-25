// ============================================================
// SectionInspector — DevTools-style section & image selector overlay
//
// When inspect mode is active, renders a transparent overlay
// across the page. As the user moves their mouse, it finds
// matching CMS section elements or CMS-tagged images, highlights
// them (blue for sections, magenta for images), and on click
// selects the section or triggers an image-replace flow.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAgent } from "./AgentProvider";
import type { SectionDescriptor } from "./types";

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
  entityType: string;
  /** "section" or "image" — determines highlight color + click behavior */
  kind: "section" | "image";
  /** For images: the dot-notation field path (e.g. "bgImageDesktop") */
  fieldPath?: string;
}

/**
 * Full-page overlay that activates when isInspecting is true.
 * Must be rendered outside the agent panel (at the document root level)
 * so it can cover the entire page.
 */
export function SectionInspector() {
  const { isInspecting, selectSection, requestImageReplace, config } = useAgent();
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const matchedRef = useRef<{
    el: Element;
    descriptor?: SectionDescriptor;
    kind: "section" | "image";
    entityType?: string;
    fieldPath?: string;
    recordId?: string;
    recordName?: string;
  } | null>(null);
  const sections = config.sections;

  // Find the closest CMS image element at a given point
  const findImageAt = useCallback(
    (x: number, y: number): { el: Element; entityType: string; fieldPath: string; recordId?: string; recordName?: string } | null => {
      // Get all elements at this point
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        // Check if this is an <img> with data-cms-field
        if (el.tagName === "IMG" && el.hasAttribute("data-cms-field")) {
          const fieldPath = el.getAttribute("data-cms-field")!;
          // Walk up to find data-cms-entity (and optionally data-cms-record-id)
          let entityType = "";
          let recordId: string | undefined;
          let recordName: string | undefined;
          let parent: Element | null = el;
          while (parent) {
            // Pick up record-level attributes from the closest ancestor
            if (!recordId && parent.hasAttribute("data-cms-record-id")) {
              recordId = parent.getAttribute("data-cms-record-id")!;
            }
            if (!recordName && parent.hasAttribute("data-cms-record-name")) {
              recordName = parent.getAttribute("data-cms-record-name")!;
            }
            if (parent.hasAttribute("data-cms-entity")) {
              entityType = parent.getAttribute("data-cms-entity")!;
              break;
            }
            parent = parent.parentElement;
          }
          if (entityType) {
            return { el, entityType, fieldPath, recordId, recordName };
          }
        }
        // Also check background-image elements with data-cms-field
        if (el.hasAttribute("data-cms-field") && el.hasAttribute("data-cms-entity")) {
          const fieldPath = el.getAttribute("data-cms-field")!;
          const entityType = el.getAttribute("data-cms-entity")!;
          const recordId = el.getAttribute("data-cms-record-id") || undefined;
          const recordName = el.getAttribute("data-cms-record-name") || undefined;
          // Check if this field looks like an image field
          const style = window.getComputedStyle(el);
          if (style.backgroundImage && style.backgroundImage !== "none") {
            return { el, entityType, fieldPath, recordId, recordName };
          }
        }
      }
      return null;
    },
    []
  );

  // Find which section element contains or matches the hovered point
  const findSectionAt = useCallback(
    (x: number, y: number): { el: Element; descriptor: SectionDescriptor } | null => {
      if (!sections || sections.length === 0) return null;

      let best: { el: Element; descriptor: SectionDescriptor; area: number } | null = null;

      for (const desc of sections) {
        const els = document.querySelectorAll(desc.selector);
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            const area = rect.width * rect.height;
            if (!best || area < best.area) {
              best = { el, descriptor: desc, area };
            }
          }
        }
      }

      return best ? { el: best.el, descriptor: best.descriptor } : null;
    },
    [sections]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Images take priority over sections (more specific)
      const imageMatch = findImageAt(e.clientX, e.clientY);
      if (imageMatch) {
        matchedRef.current = {
          el: imageMatch.el,
          kind: "image",
          entityType: imageMatch.entityType,
          fieldPath: imageMatch.fieldPath,
          recordId: imageMatch.recordId,
          recordName: imageMatch.recordName,
        };
        const rect = imageMatch.el.getBoundingClientRect();
        setHighlight({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          label: imageMatch.recordName ? `Click to replace image (${imageMatch.recordName})` : `Click to replace image`,
          entityType: imageMatch.entityType,
          kind: "image",
          fieldPath: imageMatch.fieldPath,
        });
        return;
      }

      const match = findSectionAt(e.clientX, e.clientY);
      if (match) {
        matchedRef.current = {
          el: match.el,
          descriptor: match.descriptor,
          kind: "section",
        };
        const rect = match.el.getBoundingClientRect();
        setHighlight({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          label: match.descriptor.label,
          entityType: match.descriptor.entityType,
          kind: "section",
        });
      } else {
        matchedRef.current = null;
        setHighlight(null);
      }
    },
    [findImageAt, findSectionAt]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const matched = matchedRef.current;
      if (!matched) {
        selectSection(null);
        return;
      }

      if (matched.kind === "image" && matched.entityType && matched.fieldPath) {
        // Trigger image replace flow — opens panel with pre-composed message
        requestImageReplace(matched.entityType, matched.fieldPath, matched.recordId, matched.recordName);
      } else if (matched.kind === "section" && matched.descriptor) {
        selectSection(matched.descriptor);
      } else {
        selectSection(null);
      }
    },
    [selectSection, requestImageReplace]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        selectSection(null);
      }
    },
    [selectSection]
  );

  // Attach/detach global listeners
  useEffect(() => {
    if (!isInspecting) {
      setHighlight(null);
      matchedRef.current = null;
      return;
    }

    // Use capture phase so we intercept before any page click handlers
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isInspecting, handleMouseMove, handleClick, handleKeyDown]);

  if (!isInspecting) return null;

  const isImage = highlight?.kind === "image";

  return (
    <>
      {/* Full-page transparent overlay to capture all mouse events */}
      <div className="cap-inspector-overlay" />

      {/* Highlight box around the hovered section or image */}
      {highlight && (
        <div
          className={`cap-inspector-highlight ${isImage ? "cap-inspector-highlight--image" : ""}`}
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        >
          {/* Label tooltip */}
          <div className={`cap-inspector-label ${isImage ? "cap-inspector-label--image" : ""}`}>
            <span className="cap-inspector-label__entity">
              {highlight.entityType}
              {highlight.fieldPath ? `.${highlight.fieldPath}` : ""}
            </span>
            <span className="cap-inspector-label__name">
              {highlight.label}
            </span>
          </div>
        </div>
      )}

      {/* Instruction bar at top */}
      <div className="cap-inspector-bar">
        <span className="cap-inspector-bar__icon">
          {/* Crosshair icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </span>
        Select a section or click an image to replace &middot; Press <kbd>Esc</kbd> to cancel
      </div>
    </>
  );
}
