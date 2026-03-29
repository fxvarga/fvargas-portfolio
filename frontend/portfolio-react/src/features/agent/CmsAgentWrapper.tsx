// ============================================================
// CmsAgentWrapper — Connects the @fvargas/cms-agent-panel
// to the portfolio-react app's config and auth system.
//
// Only renders if the admin has a token in localStorage.
// ============================================================

import React, { useMemo, useRef } from 'react';
import { AgentProvider, AgentPanel, AgentToggle, SectionInspector, PreviewBanner } from '@fvargas/cms-agent-panel';
import '@fvargas/cms-agent-panel/styles.css';
import type { AgentPanelConfig, AgentPanelCallbacks, SectionDescriptor } from '@fvargas/cms-agent-panel';
import { useConfig } from '../../app/providers/ConfigProvider';
import { useRealCMS } from '../../shared/hooks/useCMS';
import { PreviewProvider } from './PreviewProvider';

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
 * Known CMS-driven sections in portfolio-react's HomePage.
 * Selectors use react-scroll Element name attributes and known CSS classes.
 */
const PORTFOLIO_SECTIONS: SectionDescriptor[] = [
  { selector: ".tp-hero-section-1",    entityType: "hero",        label: "Hero Section" },
  { selector: ".tf-about-section",     entityType: "about",       label: "About Section" },
  { selector: ".tp-service-area",      entityType: "services",    label: "Services Section" },
  { selector: ".tp-contact-form-area", entityType: "contact",     label: "Contact Section" },
  { selector: "#header",               entityType: "navigation",  label: "Navigation Header" },
  { selector: ".tp-site-footer",       entityType: "footer",      label: "Footer" },
];

/**
 * Wrapper that bridges portfolio-react's ConfigProvider/auth
 * into the agent panel's AgentProvider.
 *
 * Place this inside ConfigProvider + AppWithApollo + CMSProvider
 * but around the BrowserRouter so the panel is available on all routes.
 */
export const CmsAgentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const { refetch } = useRealCMS();

  const token = getStoredToken();
  const portfolioId = getStoredPortfolioId();

  // Use a ref so the callbacks object stays stable (avoids re-renders)
  // but always calls the latest refetch function.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const agentConfig = useMemo<AgentPanelConfig>(() => ({
    graphqlUrl: config.apiUrl,
    wsUrl: config.apiWsUrl,
    token: token ?? '',
    portfolioId,
    sections: PORTFOLIO_SECTIONS,
    currentRoute: window.location.pathname,
  }), [config.apiUrl, config.apiWsUrl, token, portfolioId]);

  const callbacks = useMemo<AgentPanelCallbacks>(() => ({
    onPreviewChanges: (changes) => {
      // PreviewProvider handles live preview via CMSPreviewContext automatically
      console.log('[CmsAgent] Preview changes:', changes);
    },
    onCommitted: async (result) => {
      console.log('[CmsAgent] Committed:', result);
      if (result.success) {
        // Refetch CMS data from the backend so the page reflects committed changes
        // without a full page reload. This preserves panel state and chat history.
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
      <PreviewProvider>
        {children}
      </PreviewProvider>
      <PreviewBanner />
      <AgentPanel />
      <AgentToggle />
      <SectionInspector />
    </AgentProvider>
  );
};
