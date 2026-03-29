// ============================================================
// CmsAgentWrapper — Connects the @fvargas/cms-agent-panel
// to Jessica's portfolio app's auth system.
//
// Only renders if the admin has a token in localStorage.
// ============================================================

import { useMemo, useRef, type ReactNode } from 'react';
import { AgentProvider, AgentPanel, AgentToggle, SectionInspector, PreviewBanner } from '@fvargas/cms-agent-panel';
import '@fvargas/cms-agent-panel/styles.css';
import type { AgentPanelConfig, AgentPanelCallbacks, SectionDescriptor } from '@fvargas/cms-agent-panel';
import { PreviewProvider } from './PreviewProvider';
import type { CMSContent } from '../types';

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
 * Known CMS-driven sections in Jessica's portfolio.
 */
const PORTFOLIO_SECTIONS: SectionDescriptor[] = [
  { selector: '.navbar',         entityType: 'navigation',   label: 'Navigation' },
  { selector: '.hero',           entityType: 'hero',         label: 'Hero Section' },
  { selector: '#about',          entityType: 'about',        label: 'About Section' },
  { selector: '#case-studies',   entityType: 'case-studies',  label: 'Case Studies' },
  { selector: '#portfolio',      entityType: 'portfolio',    label: 'Portfolio' },
  { selector: '.footer',         entityType: 'footer',       label: 'Footer' },
];

interface CmsAgentWrapperProps {
  children: ReactNode;
  content: CMSContent;
  onContentChange: (content: CMSContent) => void;
  onRefetch: () => Promise<void>;
}

export function CmsAgentWrapper({ children, content, onContentChange, onRefetch }: CmsAgentWrapperProps) {
  const token = getStoredToken();
  const portfolioId = getStoredPortfolioId();

  // If no token, don't render the agent panel at all — FAB stays hidden
  if (!token) return <>{children}</>;

  const refetchRef = useRef(onRefetch);
  refetchRef.current = onRefetch;

  const graphqlUrl = import.meta.env.VITE_API_URL || '/graphql';
  const wsUrl = graphqlUrl.replace(/^http/, 'ws');

  const agentConfig = useMemo<AgentPanelConfig>(() => ({
    graphqlUrl,
    wsUrl,
    token,
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
