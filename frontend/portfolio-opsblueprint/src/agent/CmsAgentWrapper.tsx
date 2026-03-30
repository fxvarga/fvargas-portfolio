// ============================================================
// CmsAgentWrapper — Connects the @fvargas/cms-agent-panel
// to the OpsBlueprint app's config and auth system.
//
// Only renders if the admin has a token in localStorage.
// ============================================================

import { useMemo, useRef } from 'react';
import { AgentProvider, AgentPanel, AgentToggle, SectionInspector, PreviewBanner } from '@fvargas/cms-agent-panel';
import '@fvargas/cms-agent-panel/styles.css';
import type { AgentPanelConfig, AgentPanelCallbacks, SectionDescriptor } from '@fvargas/cms-agent-panel';
import { PreviewProvider } from './PreviewProvider';
import type { CMSContent } from '../cms';

const AUTH_TOKEN_KEY = 'cms_auth_token';
const SELECTED_PORTFOLIO_KEY = 'cms_selected_portfolio';

function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredPortfolioId(): string | undefined {
  const raw = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
  if (!raw) return undefined;
  try {
    const portfolio = JSON.parse(raw);
    return portfolio.id;
  } catch {
    return undefined;
  }
}

/**
 * Known CMS-driven sections in OpsBlueprint.
 * Some sections use the Section component with an `id` prop,
 * while others use bare <section> elements.
 * Hero and CTA don't have IDs, so we use positional/class selectors.
 */
const PORTFOLIO_SECTIONS: SectionDescriptor[] = [
  { selector: 'nav',                entityType: 'navigation',  label: 'Navigation' },
  { selector: 'section:first-of-type', entityType: 'hero',     label: 'Hero Section' },
  { selector: '#about',             entityType: 'about',       label: 'About Section' },
  { selector: '#services',          entityType: 'services',    label: 'Services Section' },
  { selector: '#how-it-works',      entityType: 'how-it-works', label: 'How It Works' },
  { selector: '#testimonials',      entityType: 'testimonials', label: 'Testimonials' },
  { selector: '#lead-form',         entityType: 'lead-capture', label: 'Lead Capture Form' },
  { selector: '.bg-primary-800',    entityType: 'cta',         label: 'Call to Action' },
  { selector: 'footer',             entityType: 'footer',      label: 'Footer' },
];

interface CmsAgentWrapperProps {
  children: React.ReactNode;
  content: CMSContent;
  onContentChange: (content: CMSContent) => void;
  onRefetch: () => Promise<void>;
}

/**
 * Wrapper that bridges OpsBlueprint's auth and content state
 * into the agent panel's AgentProvider.
 */
export function CmsAgentWrapper({ children, content, onContentChange, onRefetch }: CmsAgentWrapperProps) {
  const token = getStoredToken();
  const portfolioId = getStoredPortfolioId();

  const refetchRef = useRef(onRefetch);
  refetchRef.current = onRefetch;

  const graphqlUrl = import.meta.env.VITE_API_URL || '/graphql';
  const wsUrl = graphqlUrl.replace(/^http/, 'ws');

  const agentConfig = useMemo<AgentPanelConfig>(() => ({
    graphqlUrl,
    wsUrl,
    token: token ?? '',
    portfolioId,
    sections: PORTFOLIO_SECTIONS,
    currentRoute: window.location.pathname,
  }), [graphqlUrl, wsUrl, token, portfolioId]);

  const callbacks = useMemo<AgentPanelCallbacks>(() => ({
    onPreviewChanges: (changes) => {
      console.log('[CmsAgent] Preview changes:', changes);
    },
    onCommitted: async (result) => {
      console.log('[CmsAgent] Committed:', result);
      if (result.success) {
        try {
          await refetchRef.current();
          console.log('[CmsAgent] CMS data refreshed after commit');
        } catch (err) {
          console.error('[CmsAgent] Failed to refresh CMS data after commit:', err);
        }
      }
    },
    onDiscard: () => {
      console.log('[CmsAgent] Changes discarded');
    },
  }), []);

  // If no token, don't render the agent panel at all — FAB stays hidden
  if (!token) return <>{children}</>;

  return (
    <AgentProvider config={agentConfig} callbacks={callbacks}>
      <PreviewProvider content={content} onContentChange={onContentChange}>
        {children}
      </PreviewProvider>
      <PreviewBanner />
      <AgentPanel />
      <AgentToggle />
      <SectionInspector />
    </AgentProvider>
  );
}
