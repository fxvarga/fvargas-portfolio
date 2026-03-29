/**
 * CMS Client — Lightweight GraphQL client for Executive Catering CT
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
   * Fetch multiple entity types in one round-trip using aliases.
   * Returns a map keyed by entity type.
   */
  function fetchContentByTypes(entityTypes) {
    // Build aliased query to fetch multiple singletons in one request
    var parts = entityTypes.map(function (type, i) {
      // GraphQL aliases can't have hyphens, use index-based alias
      var alias = 'type_' + i;
      return alias + ': publishedContentSingle(entityType: "' + type + '") { id entityType data version updatedAt }';
    });
    var query = '{ ' + parts.join(' ') + ' }';

    return gql(query).then(function (data) {
      var map = {};
      if (data) {
        entityTypes.forEach(function (type, i) {
          var alias = 'type_' + i;
          if (data[alias]) {
            map[type] = parseRecord(data[alias]);
          }
        });
      }
      return map;
    });
  }

  /**
   * Fetch collection records for an entity type.
   * Returns array of parsed records.
   */
  function fetchCollection(entityType) {
    return fetchContent(entityType);
  }

  // Expose on window for other scripts
  window.CmsClient = {
    fetchContent: fetchContent,
    fetchContentSingle: fetchContentSingle,
    fetchContentByTypes: fetchContentByTypes,
    fetchCollection: fetchCollection
  };
})(window);
