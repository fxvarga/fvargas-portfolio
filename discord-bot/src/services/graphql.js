// GraphQL client for the CMS backend
// Makes plain fetch calls to the backend's /graphql endpoint

const API_URL = process.env.CMS_API_URL || 'http://backend:5000/graphql';

/**
 * Execute a GraphQL query/mutation against the CMS backend
 * @param {string} query - GraphQL query string
 * @param {object} [variables] - Query variables
 * @param {object} [options] - Additional options
 * @param {string} [options.token] - JWT bearer token
 * @param {string} [options.portfolioId] - X-Portfolio-ID header
 * @returns {Promise<object>} - The GraphQL response data
 */
async function gqlRequest(query, variables = {}, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  if (options.portfolioId) {
    headers['X-Portfolio-ID'] = options.portfolioId;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ');
    throw new Error(`GraphQL error: ${messages}`);
  }

  return json.data;
}

/**
 * Login to the CMS backend
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, user: object, portfolios: Array }>}
 */
export async function login(username, password) {
  const query = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        token
        errorMessage
        user {
          id
          username
          role
        }
        portfolios {
          id
          slug
          name
        }
      }
    }
  `;

  const data = await gqlRequest(query, {
    input: { username, password },
  });

  const result = data.login;

  if (!result.success) {
    throw new Error(`Login failed: ${result.errorMessage || 'Unknown error'}`);
  }

  return {
    token: result.token,
    user: result.user,
    portfolios: result.portfolios,
  };
}

/**
 * Send a chat message to the CMS agent
 * @param {object} params
 * @param {string} params.token - JWT token
 * @param {string} params.portfolioId - Target portfolio GUID
 * @param {string} params.message - User's message
 * @param {string} [params.currentRoute] - Current page route
 * @param {string} [params.focusedSection] - Focused CMS section
 * @param {string} [params.sessionId] - Session ID for multi-turn
 * @param {Array} [params.conversationHistory] - Previous messages
 * @returns {Promise<{ message: string, sessionId: string, proposedChanges: Array }>}
 */
export async function agentChat({
  token,
  portfolioId,
  message,
  currentRoute = '/',
  focusedSection = null,
  sessionId = null,
  conversationHistory = [],
}) {
  const query = `
    mutation AgentChat($input: AgentChatInput!) {
      agentChat(input: $input) {
        message
        sessionId
        proposedChanges {
          id
          entityType
          recordId
          fieldPath
          oldValue
          newValue
          description
        }
      }
    }
  `;

  const input = {
    message,
    currentRoute,
    conversationHistory,
  };

  if (focusedSection) input.focusedSection = focusedSection;
  if (sessionId) input.sessionId = sessionId;

  const data = await gqlRequest(query, { input }, { token, portfolioId });
  return data.agentChat;
}

/**
 * Commit proposed changes
 * @param {object} params
 * @param {string} params.token - JWT token
 * @param {string} params.portfolioId - Target portfolio GUID
 * @param {Array} params.changes - Proposed changes to commit
 * @returns {Promise<{ success: boolean, results: Array, error: string|null }>}
 */
export async function agentCommit({ token, portfolioId, changes }) {
  const query = `
    mutation AgentCommit($input: AgentCommitInput!) {
      agentCommit(input: $input) {
        success
        results {
          changeId
          success
          error
        }
        error
      }
    }
  `;

  const input = {
    changes: changes.map((c) => ({
      id: c.id,
      entityType: c.entityType,
      recordId: c.recordId || null,
      fieldPath: c.fieldPath,
      oldValue: c.oldValue,
      newValue: c.newValue,
      description: c.description,
    })),
  };

  const data = await gqlRequest(query, { input }, { token, portfolioId });
  return data.agentCommit;
}
