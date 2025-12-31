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

const CONTENT_TYPES = [
  { key: 'hero', label: 'Hero Section', icon: '&#9733;' },
  { key: 'about', label: 'About Section', icon: '&#9786;' },
  { key: 'services', label: 'Services', icon: '&#9881;' },
  { key: 'contact', label: 'Contact', icon: '&#9993;' },
  { key: 'navigation', label: 'Navigation', icon: '&#9776;' },
  { key: 'site-config', label: 'Site Config', icon: '&#9881;' },
  { key: 'footer', label: 'Footer', icon: '&#9638;' },
];

const DashboardPage: React.FC = () => {
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="admin-stat-value">{CONTENT_TYPES.length}</div>
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
                {CONTENT_TYPES.map((type) => {
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
          <div className="admin-btn-group">
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
