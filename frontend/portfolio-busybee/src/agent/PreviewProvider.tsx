// ============================================================
// PreviewProvider — Merges agent proposed changes over real CMS
// data for Busybee's prop-drilling architecture.
// ============================================================

import { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useAgent } from '@fvargas/cms-agent-panel';
import type { ProposedChange, SectionDescriptor } from '@fvargas/cms-agent-panel';
import type { CMSContent } from '../types';

function parseJsonValue(jsonStr: string): unknown {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return jsonStr;
  }
}

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
 * Map CMS entity types to CMSContent keys for Busybee.
 */
const ENTITY_TYPE_TO_KEY: Record<string, keyof CMSContent> = {
  'navigation': 'navigation',
  'hero': 'hero',
  'stats': 'stats',
  'services': 'services',
  'about': 'about',
  'testimonials': 'testimonials',
  'contact': 'contact',
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

  const originalContentRef = useRef<CMSContent>(content);
  const isShowingPreviewRef = useRef(false);

  useEffect(() => {
    if (!isShowingPreviewRef.current) {
      originalContentRef.current = content;
    }
  }, [content]);

  const previewContent = useMemo(() => {
    if (!isPreviewActive || proposedChanges.length === 0) {
      return null;
    }
    return applyChanges(originalContentRef.current, proposedChanges);
  }, [isPreviewActive, proposedChanges]);

  useEffect(() => {
    if (previewContent) {
      isShowingPreviewRef.current = true;
      onContentChange(previewContent);
    } else if (isShowingPreviewRef.current) {
      isShowingPreviewRef.current = false;
      onContentChange(originalContentRef.current);
    }
  }, [previewContent, onContentChange]);

  return <>{children}</>;
}
