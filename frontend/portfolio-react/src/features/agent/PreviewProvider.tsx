// ============================================================
// PreviewProvider — Merges agent proposed changes over real CMS
// data and provides the result via CMSPreviewContext.
//
// Sits between CMSProvider and CmsAgentWrapper's children.
// When isPreviewActive is true AND there are proposed changes,
// all useCMS() consumers automatically render preview data.
// ============================================================

import React, { useMemo, useEffect, useRef } from 'react';
import { useAgent } from '@fvargas/cms-agent-panel';
import type { ProposedChange } from '@fvargas/cms-agent-panel';
import { useRealCMS, CMSPreviewContext, BlogPreviewContext } from '../../shared/hooks/useCMS';
import type { BlogPostPreviewOverrides } from '../../shared/hooks/useCMS';
import type {
  HeroSection,
  AboutSection,
  ServicesSection,
  ContactSection,
  Navigation,
  Footer,
  SiteConfig,
  Service,
} from '../../api/cmsApi';

/**
 * Maps an entityType + fieldPath to the correct section/field in the
 * CMSContextValue structure. The backend returns field paths like "title",
 * "description", "name", etc. — these correspond to top-level keys within
 * each section's data object.
 *
 * The values from the backend are JSON-serialized strings (e.g. `"\"Hello World\""`)
 * because ProposedChange stores oldValue/newValue as serialized JSON.
 */

type SectionKey = 'hero' | 'about' | 'services' | 'contact' | 'navigation' | 'footer' | 'site-config';

/**
 * Parse a JSON-serialized value back to its actual type.
 * The mock agent serializes values with JsonSerializer.Serialize which
 * wraps strings in double quotes. E.g. `"\"Hello World\""` → `"Hello World"`.
 */
function parseJsonValue(jsonStr: string): unknown {
  try {
    return JSON.parse(jsonStr);
  } catch {
    // If it's not valid JSON, return as-is (plain string)
    return jsonStr;
  }
}

/**
 * Sets a value at a dot-notation path on an object.
 * Supports simple paths like "title" and nested paths like "ctaButton.label".
 * Does not mutate the original — works on a pre-cloned object.
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
    // Handle array index syntax like "services[0]"
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      const arr = current[arrayKey];
      if (Array.isArray(arr) && index >= 0 && index < arr.length) {
        current = arr[index] as Record<string, unknown>;
      } else {
        return; // Can't navigate further
      }
    } else {
      if (typeof current[key] !== 'object' || current[key] === null) {
        return; // Can't navigate further
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
}

/**
 * Deep clone an object. Uses structuredClone if available, falls back to
 * JSON round-trip (which is fine for our CMS data — no functions/symbols).
 */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

interface SectionData {
  hero: HeroSection | null;
  about: AboutSection | null;
  services: ServicesSection | null;
  contact: ContactSection | null;
  navigation: Navigation | null;
  footer: Footer | null;
  siteConfig: SiteConfig | null;
}

/**
 * Apply a single ProposedChange to the cloned section data.
 * Returns true if handled, false if it's a collection type (e.g. blog-post)
 * that needs separate handling.
 */
function applyChange(sections: SectionData, change: ProposedChange): boolean {
  const value = parseJsonValue(change.newValue);
  const entityType = change.entityType as SectionKey;

  let target: Record<string, unknown> | null = null;

  switch (entityType) {
    case 'hero':
      target = sections.hero as unknown as Record<string, unknown>;
      break;
    case 'about':
      target = sections.about as unknown as Record<string, unknown>;
      break;
    case 'services':
      target = sections.services as unknown as Record<string, unknown>;
      break;
    case 'contact':
      target = sections.contact as unknown as Record<string, unknown>;
      break;
    case 'navigation':
      target = sections.navigation as unknown as Record<string, unknown>;
      break;
    case 'footer':
      target = sections.footer as unknown as Record<string, unknown>;
      break;
    case 'site-config':
      target = sections.siteConfig as unknown as Record<string, unknown>;
      break;
    default:
      // Not a singleton section — caller handles collection types
      return false;
  }

  if (!target) {
    console.warn(`[PreviewProvider] Section "${entityType}" is null, cannot apply change`);
    return true; // Handled (just couldn't apply)
  }

  setNestedValue(target, change.fieldPath, value);
  return true;
}

/**
 * Adds visual highlights to sections that have pending changes.
 * Uses the CSS class `cap-preview-highlight` and a data attribute for the label.
 */
function usePreviewHighlights(
  changes: ProposedChange[],
  isActive: boolean,
  sections: Array<{ selector: string; entityType: string; label: string }>
) {
  const highlightedRefs = useRef<Set<Element>>(new Set());

  useEffect(() => {
    // Copy ref value for stable references within this effect
    const refs = highlightedRefs.current;

    // Clean up existing highlights
    refs.forEach((el) => {
      el.classList.remove('cap-preview-highlight');
      el.removeAttribute('data-cap-preview-label');
    });
    refs.clear();

    if (!isActive || changes.length === 0) return;

    // Find which entity types have changes
    const changedTypes = new Set(changes.map((c) => c.entityType));

    // Highlight the corresponding sections
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

    // Cleanup on unmount or when changes/isActive change
    return () => {
      refs.forEach((el) => {
        el.classList.remove('cap-preview-highlight');
        el.removeAttribute('data-cap-preview-label');
      });
      refs.clear();
    };
  }, [changes, isActive, sections]);
}

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const { proposedChanges, isPreviewActive, config } = useAgent();
  const realCMS = useRealCMS();

  // Apply visual highlights to sections with pending changes
  usePreviewHighlights(proposedChanges, isPreviewActive, config.sections ?? []);

  // Build preview data by merging proposed changes over real data
  const previewData = useMemo(() => {
    if (!isPreviewActive || proposedChanges.length === 0) {
      return undefined; // No preview — useCMS falls through to real context
    }

    // Deep clone the section data
    const sections: SectionData = {
      hero: realCMS.hero ? deepClone(realCMS.hero) : null,
      about: realCMS.about ? deepClone(realCMS.about) : null,
      services: realCMS.services ? deepClone(realCMS.services) : null,
      contact: realCMS.contact ? deepClone(realCMS.contact) : null,
      navigation: realCMS.navigation ? deepClone(realCMS.navigation) : null,
      footer: realCMS.footer ? deepClone(realCMS.footer) : null,
      siteConfig: realCMS.siteConfig ? deepClone(realCMS.siteConfig) : null,
    };

    // Apply each proposed change (skipping collection types — they go to blogOverrides)
    for (const change of proposedChanges) {
      applyChange(sections, change);
    }

    // Rebuild the getServiceById function for the cloned data
    const getServiceById = (id: string): Service | undefined => {
      return sections.services?.services.find((s) => s.id === id);
    };

    return {
      isLoading: realCMS.isLoading,
      error: realCMS.error,
      siteConfig: sections.siteConfig,
      hero: sections.hero,
      about: sections.about,
      services: sections.services,
      contact: sections.contact,
      navigation: sections.navigation,
      footer: sections.footer,
      getServiceById,
      refetch: realCMS.refetch,
    };
  }, [realCMS, proposedChanges, isPreviewActive]);

  // Build blog post preview overrides from collection-type changes
  const blogOverrides = useMemo<BlogPostPreviewOverrides | undefined>(() => {
    if (!isPreviewActive || proposedChanges.length === 0) {
      return undefined;
    }

    const overrides: BlogPostPreviewOverrides = {};

    for (const change of proposedChanges) {
      if (change.entityType !== 'blog-post') continue;
      // recordId identifies which blog post this change targets
      const recordId = change.recordId;
      if (!recordId) continue;

      if (!overrides[recordId]) {
        overrides[recordId] = {};
      }

      const value = parseJsonValue(change.newValue);
      // For blog posts, fieldPath maps directly to BlogPost fields (e.g. "title", "excerpt")
      overrides[recordId][change.fieldPath] = value;
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }, [proposedChanges, isPreviewActive]);

  return (
    <CMSPreviewContext.Provider value={previewData}>
      <BlogPreviewContext.Provider value={blogOverrides}>
        {children}
      </BlogPreviewContext.Provider>
    </CMSPreviewContext.Provider>
  );
}
