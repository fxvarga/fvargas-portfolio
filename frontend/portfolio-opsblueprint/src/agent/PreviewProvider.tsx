// ============================================================
// PreviewProvider — Merges agent proposed changes over real CMS
// data and pushes the result to the parent content state.
//
// For prop-drilling apps (no CMS Context), this works by
// calling onContentChange with merged data when preview is
// active, and restoring original data when preview is cleared.
// ============================================================

import { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useAgent } from '@fvargas/cms-agent-panel';
import type { ProposedChange, SectionDescriptor } from '@fvargas/cms-agent-panel';
import type { CMSContent } from '../cms';

/**
 * Parse a JSON-serialized value back to its actual type.
 * The agent serializes values with JsonSerializer.Serialize which
 * wraps strings in double quotes.
 */
function parseJsonValue(jsonStr: string): unknown {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return jsonStr;
  }
}

/**
 * Sets a value at a dot-notation path on an object.
 * Supports simple paths like "title" and nested paths like "ctaButton.label".
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');

  if (parts.length === 1) {
    obj[parts[0]] = value;
    return;
  }

  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      const arr = current[arrayKey];
      if (Array.isArray(arr) && index >= 0 && index < arr.length) {
        current = arr[index] as Record<string, unknown>;
      } else {
        return;
      }
    } else {
      if (typeof current[key] !== 'object' || current[key] === null) {
        return;
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
}

function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Map CMS entity types (including hyphenated ones) to CMSContent keys.
 */
const ENTITY_TYPE_TO_KEY: Record<string, keyof CMSContent> = {
  'site-config': 'siteConfig',
  'navigation': 'navigation',
  'hero': 'hero',
  'problem': 'problem',
  'solution': 'solution',
  'services': 'services',
  'how-it-works': 'howItWorks',
  'testimonials': 'testimonials',
  'about': 'about',
  'lead-capture': 'leadCapture',
  'cta': 'cta',
  'footer': 'footer',
};

function applyChanges(content: CMSContent, changes: ProposedChange[]): CMSContent {
  const cloned = deepClone(content);

  for (const change of changes) {
    const key = ENTITY_TYPE_TO_KEY[change.entityType];
    if (!key) {
      console.warn(`[PreviewProvider] Unknown entityType: ${change.entityType}`);
      continue;
    }

    const target = cloned[key];
    if (!target || typeof target !== 'object') {
      console.warn(`[PreviewProvider] Section "${String(key)}" is null, cannot apply change`);
      continue;
    }

    const value = parseJsonValue(change.newValue);
    setNestedValue(target as unknown as Record<string, unknown>, change.fieldPath, value);
  }

  return cloned;
}

/**
 * Adds visual highlights to sections that have pending changes.
 */
function usePreviewHighlights(
  changes: ProposedChange[],
  isActive: boolean,
  sections: SectionDescriptor[]
) {
  const highlightedRefs = useRef<Set<Element>>(new Set());

  useEffect(() => {
    const refs = highlightedRefs.current;

    refs.forEach((el) => {
      el.classList.remove('cap-preview-highlight');
      el.removeAttribute('data-cap-preview-label');
    });
    refs.clear();

    if (!isActive || changes.length === 0) return;

    const changedTypes = new Set(changes.map((c) => c.entityType));

    for (const section of sections) {
      if (changedTypes.has(section.entityType)) {
        const el = document.querySelector(section.selector);
        if (el) {
          el.classList.add('cap-preview-highlight');
          el.setAttribute('data-cap-preview-label', `Modified: ${section.label}`);
          refs.add(el);
        }
      }
    }

    return () => {
      refs.forEach((el) => {
        el.classList.remove('cap-preview-highlight');
        el.removeAttribute('data-cap-preview-label');
      });
      refs.clear();
    };
  }, [changes, isActive, sections]);
}

interface PreviewProviderProps {
  children: ReactNode;
  content: CMSContent;
  onContentChange: (content: CMSContent) => void;
}

export function PreviewProvider({ children, content, onContentChange }: PreviewProviderProps) {
  const { proposedChanges, isPreviewActive, config } = useAgent();

  usePreviewHighlights(proposedChanges, isPreviewActive, config.sections ?? []);

  // Store the original (non-preview) content so we can restore it
  const originalContentRef = useRef<CMSContent>(content);

  // Track whether we're currently showing preview data
  const isShowingPreviewRef = useRef(false);

  // Update the original content ref when content changes from a real refetch
  // (not from our own preview updates)
  useEffect(() => {
    if (!isShowingPreviewRef.current) {
      originalContentRef.current = content;
    }
  }, [content]);

  // Compute preview content
  const previewContent = useMemo(() => {
    if (!isPreviewActive || proposedChanges.length === 0) {
      return null;
    }
    return applyChanges(originalContentRef.current, proposedChanges);
  }, [isPreviewActive, proposedChanges]);

  // Push preview content to parent when it changes
  useEffect(() => {
    if (previewContent) {
      isShowingPreviewRef.current = true;
      onContentChange(previewContent);
    } else if (isShowingPreviewRef.current) {
      // Restore original content when preview is deactivated
      isShowingPreviewRef.current = false;
      onContentChange(originalContentRef.current);
    }
  }, [previewContent, onContentChange]);

  return <>{children}</>;
}
