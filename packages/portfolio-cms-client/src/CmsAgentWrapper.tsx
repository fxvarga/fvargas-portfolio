// ============================================================
// CmsAgentWrapper — Generic wrapper that bridges a portfolio
// app's config/auth to the agent panel's AgentProvider.
//
// Host apps provide their own section descriptors, config,
// and auth token retrieval. This replaces Fernando's hardcoded
// CmsAgentWrapper with a generic, reusable version.
// ============================================================

import React, { useMemo, useRef } from 'react';
import {
  AgentProvider,
  AgentPanel,
  AgentToggle,
  SectionInspector,
  PreviewBanner,
} from '@fvargas/cms-agent-panel';
import '@fvargas/cms-agent-panel/styles.css';
import type {
  AgentPanelConfig,
  AgentPanelCallbacks,
  SectionDescriptor,
} from '@fvargas/cms-agent-panel';
import { useConfig } from './ConfigProvider';
import { useRealCms } from './CmsProvider';
import { PreviewProvider } from './PreviewProvider';

const AUTH_TOKEN_KEY = 'cms_auth_token';
const SELECTED_PORTFOLIO_KEY = 'cms_selected_portfolio';

function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredPortfolioId(): string | undefined {
  const raw = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
  if (!raw) return undefined;
  try { return JSON.parse(raw).id; } catch { return undefined; }
}

export interface CmsAgentWrapperProps {
  children: React.ReactNode;
  /** CMS-driven sections on the page for the inspector. */
  sections: SectionDescriptor[];
  /** Optional: override token retrieval. */
  getToken?: () => string | null;
  /** Optional: override portfolio ID retrieval. */
  getPortfolioId?: () => string | undefined;
}

export const CmsAgentWrapper: React.FC<CmsAgentWrapperProps> = ({
  children,
  sections,
  getToken = getStoredToken,
  getPortfolioId = getStoredPortfolioId,
}) => {
  const { config } = useConfig();
  const { refetch } = useRealCms();

  const token = getToken();
  const portfolioId = getPortfolioId();

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const agentConfig = useMemo<AgentPanelConfig>(() => ({
    graphqlUrl: config.apiUrl,
    wsUrl: config.apiWsUrl,
    token: token ?? '',
    portfolioId,
    sections,
    currentRoute: window.location.pathname,
  }), [config.apiUrl, config.apiWsUrl, token, portfolioId, sections]);

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
          console.error('[CmsAgent] Failed to refresh CMS data:', err);
        }
      }
    },
    onDiscard: () => {
      console.log('[CmsAgent] Changes discarded');
    },
  }), []);

  // No token = no agent panel
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
