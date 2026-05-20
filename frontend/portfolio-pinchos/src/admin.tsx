// Pinchos admin entry — lazy-loaded from App.tsx
import { Routes, Route } from 'react-router';
import { useConfig } from '@fvargas/portfolio-cms-client';
import AdminApp from '@fvargas/cms-admin';
import type { AdminConfig } from '@fvargas/cms-admin';
import { useMemo } from 'react';
import { ApolloClient, InMemoryCache, HttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const AUTH_TOKEN_KEY = 'cms_auth_token';
const SELECTED_PORTFOLIO_KEY = 'cms_selected_portfolio';

let apolloClient: ApolloClient<unknown> | null = null;

function getOrCreateClient(apiUrl: string, apiWsUrl: string): ApolloClient<unknown> {
  if (apolloClient) return apolloClient;

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) graphQLErrors.forEach(({ message }) => console.error(`[GraphQL error]: ${message}`));
    if (networkError) console.error(`[Network error]: ${networkError}`);
  });

  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    let portfolioId: string | null = null;
    if (window.location.pathname.startsWith('/admin')) {
      const portfolioStr = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
      if (portfolioStr) {
        try { portfolioId = JSON.parse(portfolioStr).id; } catch { /* ignore */ }
      }
    }
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        ...(portfolioId ? { 'X-Portfolio-ID': portfolioId } : {}),
      },
    };
  });

  const httpLink = new HttpLink({
    uri: apiUrl,
    headers: { 'Apollo-Require-Preflight': 'true' },
  });

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsFullUrl = apiWsUrl.startsWith('ws') ? apiWsUrl : `${protocol}//${window.location.host}${apiWsUrl}`;
  const wsLink = new GraphQLWsLink(createClient({ url: wsFullUrl }));

  const splitLink = split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    authLink.concat(httpLink),
  );

  apolloClient = new ApolloClient({
    link: from([errorLink, splitLink]),
    cache: new InMemoryCache(),
    defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
  });

  return apolloClient;
}

function PinchosAdmin() {
  const { config } = useConfig();

  const adminConfig: AdminConfig = useMemo(() => {
    const apiBaseUrl = config.apiUrl.replace(/\/graphql\/?$/, '');
    return {
      getClient: () => getOrCreateClient(config.apiUrl, config.apiWsUrl),
      apiBaseUrl,
    };
  }, [config.apiUrl, config.apiWsUrl]);

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp config={adminConfig} />} />
    </Routes>
  );
}

export default PinchosAdmin;
