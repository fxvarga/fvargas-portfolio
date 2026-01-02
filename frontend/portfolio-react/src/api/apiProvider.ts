import { split, ApolloClient, InMemoryCache, from } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createUploadLink } from 'apollo-upload-client';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { AppConfig } from '../shared/types/AppConfig';

// Declare a singleton Apollo client
let apolloClient: ApolloClient<unknown> | null = null;

// Create error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Storage key for auth token (must match AuthContext)
const AUTH_TOKEN_KEY = 'cms_auth_token';

// Create auth link (assuming you have authentication)
const createAuthLink = () => {
  return setContext((_, { headers }) => {
    // Get the authentication token from local storage if it exists
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    };
  });
};

// Helper to construct WebSocket URL from a potentially relative path
const getWebSocketUrl = (wsUrl: string): string => {
  // If already a full URL, return as-is
  if (wsUrl.startsWith('wss://') || wsUrl.startsWith('ws://')) {
    return wsUrl;
  }

  // Construct from current page location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const path = wsUrl.startsWith('/') ? wsUrl : `/${wsUrl}`;
  
  return `${protocol}//${host}${path}`;
};

// Initialize Apollo client with config
export const initializeClient = (config: AppConfig): ApolloClient<unknown> => {
  // If client already exists, return it
  if (apolloClient) {
    return apolloClient;
  }

  // Validate config
  if (!config?.apiUrl || !config?.apiWsUrl) {
    throw new Error('API configuration is missing required fields');
  }

  console.log(`Initializing Apollo Client with REST endpoint: ${config.apiUrl}`);
  console.log(`Initializing Apollo Client with WebSocket endpoint: ${config.apiWsUrl}`);

  // Create HTTP link
  const httpLink = createUploadLink({
    uri: `${config.apiUrl}`,
    headers: {
      'Apollo-Require-Preflight': 'true',
    },
    // For debugging
    fetch: (uri, options) => {
      console.log('GraphQL HTTP request:', uri);
      return fetch(uri, options);
    }
  });

  // Create WebSocket link with properly constructed URL
  const wsUrl = getWebSocketUrl(config.apiWsUrl);
  console.log(`Resolved WebSocket URL: ${wsUrl}`);
  
  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrl,
      on: {
        connected: (socket) => {
          console.log('WebSocket connected successfully');
        },
        connecting: () => {
          console.log('WebSocket connecting...');
        },
        closed: (event) => {
          console.log('WebSocket closed:', event);
        },
        error: (error) => {
          console.error('WebSocket error:', error);
        },
        message: (event) => {
          console.debug('WebSocket message received');
        },
      },
    }),
  );

  // Create auth link
  const authLink = createAuthLink();

  // Create split link based on operation type
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    authLink.concat(httpLink),
  );

  // Combine with error handling
  const link = from([errorLink, splitLink]);

  // Create and cache Apollo Client
  apolloClient = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });

  return apolloClient;
};

// Get the Apollo client (or throw if not initialized)
export const getClient = (): ApolloClient<unknown> => {
  if (!apolloClient) {
    throw new Error('Apollo client not initialized. Call initializeApolloClient first.');
  }
  return apolloClient;
};