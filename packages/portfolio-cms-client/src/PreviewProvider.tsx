// ============================================================
// PreviewProvider — Generic preview applier.
//
// Listens to proposed changes from the agent panel and merges
// them over real CMS data via CmsPreviewContext.
//
// Unlike Fernando's hardcoded switch statement, this version
// is fully data-driven: it applies changes to any entity type
// by cloning the data object and setting values at the field path.
// ============================================================

import React, { useMemo, useEffect, useRef } from 'react';
import { useAgent } from '@fvargas/cms-agent-panel';
import type { ProposedChange } from '@fvargas/cms-agent-panel';
import { useRealCms, CmsPreviewContext, type CmsPreviewOverrides } from './CmsProvider';
import type { EntityRecord } from './types';

/** Parse a JSON-serialized value back to its actual type. */
function parseJsonValue(jsonStr: string): unknown {
  try { return JSON.parse(jsonStr); } catch { return jsonStr; }
}

/** Deep clone using structuredClone or JSON fallback. */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Set a value at a dot-notation path (supports array index syntax like "items[0].name").
 * Mutates the target object (caller should clone first).
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
      const arr = current[arrayMatch[1]];
      const idx = parseInt(arrayMatch[2], 10);
      if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
        current = arr[idx] as Record<string, unknown>;
      } else return;
    } else {
      if (typeof current[key] !== 'object' || current[key] === null) return;
      current = current[key] as Record<string, unknown>;
    }
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Adds visual highlights (CSS class) to page sections that have pending changes.
 */
function usePreviewHighlights(
  changes: ProposedChange[],
  isActive: boolean,
  sections: Array<{ selector: string; entityType: string; label: string }>,
) {
  const highlightedRefs = useRef<Set<Element>>(new Set());

  useEffect(() => {
    const refs = highlightedRefs.current;
    refs.forEach(el => {
      el.classList.remove('cap-preview-highlight');
      el.removeAttribute('data-cap-preview-label');
    });
    refs.clear();

    if (!isActive || changes.length === 0) return;

    const changedTypes = new Set(changes.map(c => c.entityType));
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
      refs.forEach(el => {
        el.classList.remove('cap-preview-highlight');
        el.removeAttribute('data-cap-preview-label');
      });
      refs.clear();
    };
  }, [changes, isActive, sections]);
}

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const { proposedChanges, isPreviewActive, config } = useAgent();
  const realCms = useRealCms();

  usePreviewHighlights(proposedChanges, isPreviewActive, config.sections ?? []);

  const overrides = useMemo<CmsPreviewOverrides | undefined>(() => {
    if (!isPreviewActive || proposedChanges.length === 0) return undefined;

    const singletons: Record<string, unknown> = {};
    const collections: Record<string, Record<string, Record<string, unknown>>> = {};
    const deletions: Record<string, Set<string>> = {};

    for (const change of proposedChanges) {
      // Handle delete changes
      if (change.fieldPath === '__delete__' && change.recordId) {
        if (!deletions[change.entityType]) deletions[change.entityType] = new Set();
        deletions[change.entityType].add(change.recordId);
        continue;
      }

      const value = parseJsonValue(change.newValue);

      // Determine if this is a singleton or collection entity by checking
      // if it exists as a loaded singleton in the CMS context.
      // The backend always sets recordId (even for singletons), so we can't
      // rely on recordId presence alone to distinguish them.
      const realRecord = realCms.getEntity(change.entityType);
      const isSingleton = realRecord !== null;

      if (!isSingleton && change.recordId) {
        // Collection-type change (e.g. blog-post, menu-item)
        if (!collections[change.entityType]) collections[change.entityType] = {};
        if (!collections[change.entityType][change.recordId]) {
          collections[change.entityType][change.recordId] = {};
        }
        collections[change.entityType][change.recordId][change.fieldPath] = value;
      } else {
        // Singleton change — clone the real data and apply the field change
        if (!(change.entityType in singletons)) {
          singletons[change.entityType] = realRecord?.data ? deepClone(realRecord.data) : {};
        }
        setNestedValue(
          singletons[change.entityType] as Record<string, unknown>,
          change.fieldPath,
          value,
        );
      }
    }

    return { singletons, collections, deletions };
  }, [realCms, proposedChanges, isPreviewActive]);

  return (
    <CmsPreviewContext.Provider value={overrides}>
      {children}
    </CmsPreviewContext.Provider>
  );
}
