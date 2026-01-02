import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import '../styles/admin.css';

// Types
interface ContentRecord {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
  version: number;
  publishedAt: string | null;
  updatedAt: string;
}

interface EntityDefinitionSummary {
  id: string;
  name: string;
  displayName: string | null;
  category: string | null;
  isSingleton: boolean;
}

// GraphQL query for admin content
const GET_ALL_CONTENT_ADMIN = gql`
  mutation GetAllContentAdmin($entityType: String) {
    getAllContentAdmin(entityType: $entityType) {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

// GraphQL query to fetch entity definitions (content types)
const GET_ALL_ENTITY_DEFINITIONS = gql`
  query GetAllEntityDefinitions {
    allEntityDefinitions {
      id
      name
      displayName
      category
      isSingleton
    }
  }
`;

const ContentListPage: React.FC = () => {
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [entityDefinitions, setEntityDefinitions] = useState<EntityDefinitionSummary[]>([]);
  const [contentTypeLabels, setContentTypeLabels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const client = getClient();
      const token = getAuthToken();

      // Fetch entity definitions and content in parallel
      const [definitionsResult, contentResult] = await Promise.all([
        client.query({
          query: GET_ALL_ENTITY_DEFINITIONS,
          context: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
          fetchPolicy: 'network-only',
        }),
        client.mutate({
          mutation: GET_ALL_CONTENT_ADMIN,
          context: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        }),
      ]);

      // Process entity definitions into labels map
      const definitions: EntityDefinitionSummary[] = definitionsResult.data?.allEntityDefinitions || [];
      setEntityDefinitions(definitions);
      
      const labels: Record<string, string> = {};
      definitions.forEach((def) => {
        labels[def.name] = def.displayName || def.name;
      });
      setContentTypeLabels(labels);

      setContent(contentResult.data?.getAllContentAdmin || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load content. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContent = filter === 'all' 
    ? content 
    : content.filter(c => c.entityType === filter);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLabel = (entityType: string): string => {
    return contentTypeLabels[entityType] || entityType;
  };

  // Check if an entity type is a singleton
  const isSingleton = (entityType: string): boolean => {
    const def = entityDefinitions.find(d => d.name === entityType);
    return def?.isSingleton ?? true; // Default to singleton behavior if not found
  };

  // Get the edit link for a record - include ID for non-singletons
  const getEditLink = (record: ContentRecord): string => {
    if (isSingleton(record.entityType)) {
      return `/admin/content/${record.entityType}`;
    }
    return `/admin/content/${record.entityType}/${record.id}`;
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Content Management</h1>
        <p>View and edit all content sections</p>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">{error}</div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="admin-card-title">All Content</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--admin-border)',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Types</option>
              {entityDefinitions.map((def) => (
                <option key={def.name} value={def.name}>
                  {def.displayName || def.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-loading-container" style={{ minHeight: '200px' }}>
              <div className="admin-loading-spinner"></div>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="admin-empty-state">
              <h3>No content found</h3>
              <p>
                {filter === 'all'
                  ? 'No content records exist yet.'
                  : `No ${getLabel(filter)} records found.`}
              </p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Published</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{getLabel(record.entityType)}</strong>
                      <br />
                      <small style={{ color: 'var(--admin-text-muted)' }}>
                        {record.id.substring(0, 8)}...
                      </small>
                    </td>
                    <td>
                      {record.publishedAt ? (
                        <span className="admin-badge admin-badge-success">
                          Published
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-warning">
                          Draft
                        </span>
                      )}
                    </td>
                    <td>v{record.version}</td>
                    <td>{formatDate(record.publishedAt)}</td>
                    <td>{formatDate(record.updatedAt)}</td>
                    <td>
                      <div className="admin-btn-group">
                        <Link
                          to={getEditLink(record)}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContentListPage;
