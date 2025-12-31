import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
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

// GraphQL mutations
const GET_CONTENT_BY_TYPE = gql`
  mutation GetContentByType($entityType: String!) {
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

const UPDATE_CONTENT = gql`
  mutation UpdateContent($input: UpdateContentInput!) {
    updateContent(input: $input) {
      success
      errorMessage
      record {
        id
        entityType
        data
        version
        publishedAt
        updatedAt
      }
    }
  }
`;

const PUBLISH_CONTENT = gql`
  mutation PublishContent($id: UUID!) {
    publishContent(id: $id) {
      success
      errorMessage
      record {
        id
        entityType
        data
        version
        publishedAt
        updatedAt
      }
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

const ContentEditorPage: React.FC = () => {
  const { entityType } = useParams<{ entityType: string }>();
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!entityType) return;
    
    try {
      setIsLoading(true);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: GET_CONTENT_BY_TYPE,
        variables: { entityType },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      const records = data.getAllContentAdmin || [];
      if (records.length > 0) {
        const foundRecord = records[0];
        setRecord(foundRecord);
        setJsonData(JSON.stringify(foundRecord.data, null, 2));
      } else {
        setRecord(null);
        setJsonData('{}');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    setHasChanges(true);
    setError(null);
    setSuccess(null);
  };

  const validateJson = (): Record<string, unknown> | null => {
    try {
      return JSON.parse(jsonData);
    } catch {
      setError('Invalid JSON format. Please check your syntax.');
      return null;
    }
  };

  const handleSave = async () => {
    if (!record) {
      setError('No record to save');
      return;
    }

    const parsedData = validateJson();
    if (!parsedData) return;

    try {
      setIsSaving(true);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: UPDATE_CONTENT,
        variables: {
          input: {
            id: record.id,
            data: parsedData,
          },
        },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      if (data.updateContent.success) {
        setRecord(data.updateContent.record);
        setJsonData(JSON.stringify(data.updateContent.record.data, null, 2));
        setSuccess('Content saved successfully!');
        setHasChanges(false);
      } else {
        setError(data.updateContent.errorMessage || 'Failed to save content');
      }
    } catch (err) {
      console.error('Failed to save content:', err);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!record) return;

    try {
      setIsPublishing(true);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: PUBLISH_CONTENT,
        variables: { id: record.id },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      if (data.publishContent.success) {
        setRecord(data.publishContent.record);
        setSuccess('Content published successfully!');
      } else {
        setError(data.publishContent.errorMessage || 'Failed to publish content');
      }
    } catch (err) {
      console.error('Failed to publish content:', err);
      setError('Failed to publish content. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!record) return;

    const parsedData = validateJson();
    if (!parsedData) return;

    try {
      setIsSaving(true);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: UPDATE_CONTENT,
        variables: {
          input: {
            id: record.id,
            data: parsedData,
            publish: true,
          },
        },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      if (data.updateContent.success) {
        setRecord(data.updateContent.record);
        setJsonData(JSON.stringify(data.updateContent.record.data, null, 2));
        setSuccess('Content saved and published successfully!');
        setHasChanges(false);
      } else {
        setError(data.updateContent.errorMessage || 'Failed to save content');
      }
    } catch (err) {
      console.error('Failed to save content:', err);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLabel = (): string => {
    return CONTENT_TYPE_LABELS[entityType || ''] || entityType || 'Content';
  };

  return (
    <AdminLayout>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Edit {getLabel()}</h1>
          <p>Modify the content data for this section</p>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => navigate('/admin/content')}
        >
          Back to Content
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">{error}</div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">{success}</div>
      )}

      {isLoading ? (
        <div className="admin-loading-container" style={{ minHeight: '400px' }}>
          <div className="admin-loading-spinner"></div>
          <p>Loading content...</p>
        </div>
      ) : !record ? (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-empty-state">
              <h3>No Content Found</h3>
              <p>No {getLabel()} content exists yet. The content will be created when the database is seeded.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-editor-container">
          <div className="admin-editor-main">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">JSON Editor</h2>
                {hasChanges && (
                  <span className="admin-badge admin-badge-warning">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <div className="admin-card-body" style={{ padding: 0 }}>
                <div className="admin-json-editor">
                  <textarea
                    value={jsonData}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-editor-sidebar">
            {/* Actions Card */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Actions</h2>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-full"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  
                  <button
                    className="admin-btn admin-btn-secondary admin-btn-full"
                    onClick={handleSaveAndPublish}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save & Publish'}
                  </button>

                  {!record.publishedAt && (
                    <button
                      className="admin-btn admin-btn-secondary admin-btn-full"
                      onClick={handlePublish}
                      disabled={isPublishing || hasChanges}
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Current'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Info</h2>
              </div>
              <div className="admin-card-body">
                <div style={{ fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>Status:</strong>{' '}
                    {record.publishedAt ? (
                      <span className="admin-badge admin-badge-success">Published</span>
                    ) : (
                      <span className="admin-badge admin-badge-warning">Draft</span>
                    )}
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>Version:</strong> {record.version}
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>Published:</strong>
                    <br />
                    {formatDate(record.publishedAt)}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>
                    <br />
                    {formatDate(record.updatedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Link */}
            <div className="admin-card">
              <div className="admin-card-body">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-secondary admin-btn-full"
                >
                  Preview Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ContentEditorPage;
