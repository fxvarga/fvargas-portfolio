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
  displayName?: string;
  icon?: string;
  isSingleton: boolean;
  category?: string;
}

// GraphQL queries
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

const GET_ALL_ENTITY_DEFINITIONS = gql`
  query GetAllEntityDefinitions {
    allEntityDefinitions {
      id
      name
      displayName
      icon
      isSingleton
      category
    }
  }
`;

// Fallback content types when no entity definitions are loaded
const FALLBACK_CONTENT_TYPES = [
  { name: 'hero', displayName: 'Hero Section', icon: '&#9733;' },
  { name: 'about', displayName: 'About Section', icon: '&#9786;' },
  { name: 'services', displayName: 'Services', icon: '&#9881;' },
  { name: 'contact', displayName: 'Contact', icon: '&#9993;' },
  { name: 'navigation', displayName: 'Navigation', icon: '&#9776;' },
  { name: 'site-config', displayName: 'Site Config', icon: '&#9881;' },
  { name: 'footer', displayName: 'Footer', icon: '&#9638;' },
];

const DashboardPage: React.FC = () => {
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [entityDefinitions, setEntityDefinitions] = useState<EntityDefinitionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const client = getClient();
      const token = getAuthToken();

      // Fetch content and entity definitions in parallel
      const [contentResult, definitionsResult] = await Promise.all([
        client.mutate({
          mutation: GET_ALL_CONTENT_ADMIN,
          context: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        }),
        client.query({
          query: GET_ALL_ENTITY_DEFINITIONS,
          fetchPolicy: 'network-only',
        }),
      ]);

      setContent(contentResult.data?.getAllContentAdmin || []);
      setEntityDefinitions(definitionsResult.data?.allEntityDefinitions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load content. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const getContentByType = (entityType: string): ContentRecord | undefined => {
    return content.find((c) => c.entityType === entityType);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Use entity definitions if available, otherwise fall back to hardcoded types
  const contentTypes = entityDefinitions.length > 0
    ? entityDefinitions.map((def) => ({
        key: def.name,
        label: def.displayName || def.name,
        icon: def.icon || '&#9632;',
      }))
    : FALLBACK_CONTENT_TYPES.map((t) => ({
        key: t.name,
        label: t.displayName,
        icon: t.icon,
      }));

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Overview of your portfolio content</p>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">{error}</div>
      )}

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Content Types</div>
          <div className="admin-stat-value">{contentTypes.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Published</div>
          <div className="admin-stat-value">
            {content.filter((c) => c.publishedAt).length}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Drafts</div>
          <div className="admin-stat-value">
            {content.filter((c) => !c.publishedAt).length}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Records</div>
          <div className="admin-stat-value">{content.length}</div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Content Sections</h2>
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
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentTypes.map((type) => {
                  const record = getContentByType(type.key);
                  return (
                    <tr key={type.key}>
                      <td>
                        <span
                          dangerouslySetInnerHTML={{ __html: type.icon }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {type.label}
                      </td>
                      <td>
                        {record ? (
                          record.publishedAt ? (
                            <span className="admin-badge admin-badge-success">
                              Published
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge-warning">
                              Draft
                            </span>
                          )
                        ) : (
                          <span className="admin-badge admin-badge-info">
                            Not Created
                          </span>
                        )}
                      </td>
                      <td>{record?.version || '-'}</td>
                      <td>{record ? formatDate(record.updatedAt) : '-'}</td>
                      <td>
                        <div className="admin-btn-group">
                          <Link
                            to={`/admin/content/${type.key}`}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Quick Actions</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-btn-group" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
            >
              View Portfolio
            </a>
            <Link to="/admin/content" className="admin-btn admin-btn-primary">
              Manage Content
            </Link>
            <Link to="/admin/schema" className="admin-btn admin-btn-secondary">
              Manage Content Types
            </Link>
            <Link to="/admin/schema/new" className="admin-btn admin-btn-primary">
              + New Content Type
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Schema Info */}
      {entityDefinitions.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Dynamic Schema</h2>
            <span className="admin-badge admin-badge-success">Active</span>
          </div>
          <div className="admin-card-body">
            <p style={{ marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
              Your CMS is using dynamic content types. You can create and modify content type schemas from the Content Types page.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {entityDefinitions.slice(0, 6).map((def) => (
                <Link
                  key={def.id}
                  to={`/admin/schema/${def.id}`}
                  className="admin-schema-chip"
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--admin-bg)',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'var(--admin-text)',
                    border: '1px solid var(--admin-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {def.icon && <span>{def.icon}</span>}
                  <span>{def.displayName || def.name}</span>
                  <span className="admin-badge admin-badge-info" style={{ fontSize: '0.7rem' }}>
                    {def.isSingleton ? 'Singleton' : 'Collection'}
                  </span>
                </Link>
              ))}
              {entityDefinitions.length > 6 && (
                <Link
                  to="/admin/schema"
                  style={{
                    padding: '0.5rem 1rem',
                    color: 'var(--admin-primary)',
                    textDecoration: 'none',
                  }}
                >
                  +{entityDefinitions.length - 6} more...
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DashboardPage;
