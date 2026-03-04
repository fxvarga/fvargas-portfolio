/**
 * CMS Client — Lightweight GraphQL client for 1 Stop Wings
 *
 * Fetches content from the portfolio CMS backend.
 * Caddy reverse-proxies /graphql to the backend container.
 * Tenant resolution uses the Host header (domain-based).
 *
 * If the API is unreachable or returns errors, all functions
 * resolve gracefully so the hardcoded HTML stays as fallback.
 */
(function (window) {
  'use strict';

  var GRAPHQL_ENDPOINT = '/graphql';

  /**
   * Parse the `data` field on a content record from a JSON string to an object.
   * If already an object, returns as-is. On parse failure, returns an empty object.
   * @param {Object} record - GraphQL content record with a `data` string field
   * @returns {Object} record with `data` parsed
   */
  function parseRecord(record) {
    if (!record) return record;
    if (typeof record.data === 'string') {
      try { record.data = JSON.parse(record.data); }
      catch (e) { record.data = {}; }
    }
    return record;
  }

  /**
   * Execute a GraphQL query against the CMS backend.
   * @param {string} query - GraphQL query string
   * @param {Object} [variables] - Query variables
   * @returns {Promise<Object|null>} - Parsed response data, or null on failure
   */
  function gql(query, variables) {
    return fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, variables: variables || {} })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.errors) {
          console.warn('[CMS] GraphQL errors:', json.errors);
        }
        return json.data || null;
      })
      .catch(function (err) {
        console.warn('[CMS] Fetch failed, using fallback HTML:', err.message);
        return null;
      });
  }

  /**
   * Fetch all published records for an entity type (collection).
   * @param {string} entityType
   * @returns {Promise<Array>} - Array of { id, entityType, data, ... }
   */
  function fetchContent(entityType) {
    var query =
      'query ($entityType: String!) {' +
      '  publishedContent(entityType: $entityType) {' +
      '    id entityType data version updatedAt' +
      '  }' +
      '}';
    return gql(query, { entityType: entityType }).then(function (data) {
      var records = (data && data.publishedContent) || [];
      return records.map(parseRecord);
    });
  }

  /**
   * Fetch a single published record for a singleton entity type.
   * @param {string} entityType
   * @returns {Promise<Object|null>} - Single record or null
   */
  function fetchContentSingle(entityType) {
    var query =
      'query ($entityType: String!) {' +
      '  publishedContentSingle(entityType: $entityType) {' +
      '    id entityType data version updatedAt' +
      '  }' +
      '}';
    return gql(query, { entityType: entityType }).then(function (data) {
      return parseRecord((data && data.publishedContentSingle) || null);
    });
  }

  /**
   * Fetch multiple entity types in one round-trip using getContentByTypes.
   * Returns a map keyed by entity type.
   * @param {string[]} entityTypes
   * @returns {Promise<Object>} - { "site-config": {...}, "hero": {...}, ... }
   */
  function fetchContentByTypes(entityTypes) {
    var query =
      'query ($entityTypes: [String!]!) {' +
      '  contentByTypes(entityTypes: $entityTypes) {' +
      '    entityType id data version updatedAt' +
      '  }' +
      '}';
    return gql(query, { entityTypes: entityTypes }).then(function (data) {
      var map = {};
      if (data && data.contentByTypes) {
        data.contentByTypes.forEach(function (item) {
          map[item.entityType] = parseRecord(item);
        });
      }
      return map;
    });
  }

  // Expose on window for other scripts
  window.CmsClient = {
    fetchContent: fetchContent,
    fetchContentSingle: fetchContentSingle,
    fetchContentByTypes: fetchContentByTypes
  };
})(window);
