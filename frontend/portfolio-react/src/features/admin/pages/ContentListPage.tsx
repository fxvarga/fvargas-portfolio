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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'hero': 'Hero Section',
  'about': 'About Section',
  'services': 'Services',
  'contact': 'Contact',
  'navigation': 'Navigation',
  'site-config': 'Site Configuration',
  'footer': 'Footer',
};

const ContentListPage: React.FC = () => {
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: GET_ALL_CONTENT_ADMIN,
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      setContent(data.getAllContentAdmin || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
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
    return CONTENT_TYPE_LABELS[entityType] || entityType;
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
              {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={fetchContent}
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
                          to={`/admin/content/${record.entityType}`}
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
