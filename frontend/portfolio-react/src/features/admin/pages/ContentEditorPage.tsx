import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import {
  FooterEditor,
  NavigationEditor,
  ContactEditor,
  HeroEditor,
  AboutEditor,
  SiteConfigEditor,
  ServicesEditor,
} from '../components/editors';
import { DynamicEntityEditor } from '../components/dynamic';
import { EntityDefinition, ValidationError, validateData } from '../types/entityDefinition';
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

type EditorMode = 'visual' | 'json';

// GraphQL queries and mutations
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

const GET_ENTITY_DEFINITION_BY_NAME = gql`
  query GetEntityDefinitionByName($name: String!) {
    entityDefinitionByName(name: $name) {
      id
      name
      displayName
      description
      icon
      isSingleton
      category
      attributes {
        id
        name
        type
        isRequired
        label
        helpText
        placeholder
        defaultValue
        targetEntity
        validation
        order
        options {
          value
          label
        }
        children {
          id
          name
          type
          isRequired
          label
          helpText
          placeholder
          defaultValue
          targetEntity
          order
          options {
            value
            label
          }
          children {
            id
            name
            type
            isRequired
            label
            helpText
            placeholder
            order
            options {
              value
              label
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CONTENT = gql`
  mutation UpdateContent($input: UpdateContentInput!) {
    updateContent(input: $input) {
      success
      errorMessage
      validationErrors {
        field
        message
      }
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

// Legacy content type labels (fallback when no definition exists)
const CONTENT_TYPE_LABELS: Record<string, string> = {
  'hero': 'Hero Section',
  'about': 'About Section',
  'services': 'Services',
  'contact': 'Contact',
  'navigation': 'Navigation',
  'site-config': 'Site Configuration',
  'footer': 'Footer',
};

// Legacy content types that have custom visual editors
const LEGACY_EDITOR_TYPES = ['hero', 'about', 'services', 'contact', 'navigation', 'site-config', 'footer'];

// Helper function to parse data that might be a JSON string
const parseRecordData = (data: unknown): Record<string, unknown> => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      console.error('Failed to parse record data as JSON');
      return {};
    }
  }
  return data as Record<string, unknown>;
};

const ContentEditorPage: React.FC = () => {
  const { entityType, recordId } = useParams<{ entityType: string; recordId?: string }>();
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [allRecords, setAllRecords] = useState<ContentRecord[]>([]); // For non-singleton list view
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [jsonData, setJsonData] = useState<string>('');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [entityDefinition, setEntityDefinition] = useState<EntityDefinition | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Determine if we have a visual editor available
  const hasLegacyEditor = entityType && LEGACY_EDITOR_TYPES.includes(entityType);
  const hasDynamicEditor = entityDefinition && entityDefinition.attributes.length > 0;
  const hasVisualEditor = hasLegacyEditor || hasDynamicEditor;

  const fetchEntityDefinition = useCallback(async () => {
    if (!entityType) return;
    
    try {
      const client = getClient();
      const { data } = await client.query({
        query: GET_ENTITY_DEFINITION_BY_NAME,
        variables: { name: entityType },
        fetchPolicy: 'network-only',
      });

      if (data?.entityDefinitionByName) {
        setEntityDefinition(data.entityDefinitionByName);
      }
    } catch (err) {
      // Entity definition not found - will fall back to legacy editor or JSON
      console.log('No entity definition found for:', entityType);
    }
  }, [entityType]);

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
      setAllRecords(records);

      // Determine which record to edit
      let foundRecord: ContentRecord | null = null;
      
      if (recordId) {
        // If recordId is provided, find that specific record
        foundRecord = records.find((r: ContentRecord) => r.id === recordId) || null;
      } else if (entityDefinition?.isSingleton || records.length === 1) {
        // For singletons or when there's only one record, use the first one
        foundRecord = records.length > 0 ? records[0] : null;
      }
      // If non-singleton with multiple records and no recordId, we'll show the list view

      if (foundRecord) {
        setRecord(foundRecord);
        const parsedData = parseRecordData(foundRecord.data);
        setFormData(parsedData);
        setJsonData(JSON.stringify(parsedData, null, 2));
      } else {
        setRecord(null);
        setFormData({});
        setJsonData('{}');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, recordId, entityDefinition?.isSingleton]);

  useEffect(() => {
    fetchEntityDefinition();
    fetchContent();
  }, [fetchEntityDefinition, fetchContent]);

  // Sync formData to jsonData when switching to JSON mode
  useEffect(() => {
    if (editorMode === 'json') {
      setJsonData(JSON.stringify(formData, null, 2));
    }
  }, [editorMode, formData]);

  const handleFormDataChange = (newData: Record<string, unknown>) => {
    setFormData(newData);
    setHasChanges(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]); // Clear validation errors when data changes
  };

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

  const getCurrentData = (): Record<string, unknown> | null => {
    if (editorMode === 'json') {
      return validateJson();
    }
    return formData;
  };

  const handleSwitchMode = (newMode: EditorMode) => {
    if (newMode === 'json' && editorMode === 'visual') {
      // Switching to JSON - sync formData to jsonData
      setJsonData(JSON.stringify(formData, null, 2));
    } else if (newMode === 'visual' && editorMode === 'json') {
      // Switching to visual - parse JSON and update formData
      const parsed = validateJson();
      if (parsed) {
        setFormData(parsed);
      } else {
        return; // Don't switch if JSON is invalid
      }
    }
    setEditorMode(newMode);
  };

  const handleSave = async () => {
    if (!record) {
      setError('No record to save');
      return;
    }

    const dataToSave = getCurrentData();
    if (!dataToSave) return;

    // Client-side validation
    if (entityDefinition) {
      const clientValidation = validateData(dataToSave, entityDefinition.attributes);
      if (!clientValidation.isValid) {
        setValidationErrors(clientValidation.errors);
        setError('Please fix the validation errors below');
        return;
      }
    }

    try {
      setIsSaving(true);
      setValidationErrors([]);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: UPDATE_CONTENT,
        variables: {
          input: {
            id: record.id,
            data: dataToSave,
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
        const parsedData = parseRecordData(data.updateContent.record.data);
        setFormData(parsedData);
        setJsonData(JSON.stringify(parsedData, null, 2));
        setSuccess('Content saved successfully!');
        setHasChanges(false);
        setValidationErrors([]);
      } else {
        // Handle validation errors from server
        if (data.updateContent.validationErrors && data.updateContent.validationErrors.length > 0) {
          setValidationErrors(data.updateContent.validationErrors);
          setError('Validation failed. Please fix the errors below.');
        } else {
          setError(data.updateContent.errorMessage || 'Failed to save content');
        }
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

    const dataToSave = getCurrentData();
    if (!dataToSave) return;

    // Client-side validation
    if (entityDefinition) {
      const clientValidation = validateData(dataToSave, entityDefinition.attributes);
      if (!clientValidation.isValid) {
        setValidationErrors(clientValidation.errors);
        setError('Please fix the validation errors below');
        return;
      }
    }

    try {
      setIsSaving(true);
      setValidationErrors([]);
      const client = getClient();
      const token = getAuthToken();

      const { data } = await client.mutate({
        mutation: UPDATE_CONTENT,
        variables: {
          input: {
            id: record.id,
            data: dataToSave,
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
        const parsedData = parseRecordData(data.updateContent.record.data);
        setFormData(parsedData);
        setJsonData(JSON.stringify(parsedData, null, 2));
        setSuccess('Content saved and published successfully!');
        setHasChanges(false);
        setValidationErrors([]);
      } else {
        // Handle validation errors from server
        if (data.updateContent.validationErrors && data.updateContent.validationErrors.length > 0) {
          setValidationErrors(data.updateContent.validationErrors);
          setError('Validation failed. Please fix the errors below.');
        } else {
          setError(data.updateContent.errorMessage || 'Failed to save content');
        }
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
    // Prefer displayName from entity definition
    if (entityDefinition?.displayName) {
      return entityDefinition.displayName;
    }
    return CONTENT_TYPE_LABELS[entityType || ''] || entityType || 'Content';
  };

  // Get a display title for a record (used in list view for non-singletons)
  const getRecordTitle = (rec: ContentRecord): string => {
    const data = parseRecordData(rec.data);
    // Try common title fields
    if (data.title && typeof data.title === 'string') return data.title;
    if (data.slug && typeof data.slug === 'string') return data.slug;
    if (data.name && typeof data.name === 'string') return data.name;
    if (data.headerTitle && typeof data.headerTitle === 'string') return data.headerTitle;
    return rec.id.substring(0, 8) + '...';
  };

  // Check if we should show the list view (non-singleton with multiple records and no recordId)
  const shouldShowListView = !recordId && 
    entityDefinition && 
    !entityDefinition.isSingleton && 
    allRecords.length > 1;

  const renderRecordListView = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">{getLabel()} Records</h2>
        <span className="admin-badge admin-badge-info">{allRecords.length} records</span>
      </div>
      <div className="admin-card-body" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Version</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allRecords.map((rec) => (
              <tr key={rec.id}>
                <td>
                  <strong>{getRecordTitle(rec)}</strong>
                  <br />
                  <small style={{ color: 'var(--admin-text-muted)' }}>
                    {rec.id.substring(0, 8)}...
                  </small>
                </td>
                <td>
                  {rec.publishedAt ? (
                    <span className="admin-badge admin-badge-success">Published</span>
                  ) : (
                    <span className="admin-badge admin-badge-warning">Draft</span>
                  )}
                </td>
                <td>v{rec.version}</td>
                <td>{formatDate(rec.updatedAt)}</td>
                <td>
                  <Link
                    to={`/admin/content/${entityType}/${rec.id}`}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLegacyEditor = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorProps = { data: formData as any, onChange: handleFormDataChange as any };

    switch (entityType) {
      case 'footer':
        return <FooterEditor {...editorProps} />;
      case 'navigation':
        return <NavigationEditor {...editorProps} />;
      case 'contact':
        return <ContactEditor {...editorProps} />;
      case 'hero':
        return <HeroEditor {...editorProps} />;
      case 'about':
        return <AboutEditor {...editorProps} />;
      case 'site-config':
        return <SiteConfigEditor {...editorProps} />;
      case 'services':
        return <ServicesEditor {...editorProps} />;
      default:
        return null;
    }
  };

  const renderVisualEditor = () => {
    // If we have a dynamic definition with attributes, use DynamicEntityEditor
    if (hasDynamicEditor && entityDefinition) {
      return (
        <DynamicEntityEditor
          definition={entityDefinition}
          data={formData}
          onChange={handleFormDataChange}
          validationErrors={validationErrors}
        />
      );
    }

    // Fall back to legacy hardcoded editors
    if (hasLegacyEditor) {
      return renderLegacyEditor();
    }

    return null;
  };

  const renderJsonEditor = () => (
    <div className="admin-json-editor">
      <textarea
        value={jsonData}
        onChange={(e) => handleJsonChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );

  return (
    <AdminLayout>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{shouldShowListView ? getLabel() : `Edit ${getLabel()}`}</h1>
          <p>
            {entityDefinition?.description || (shouldShowListView ? `Manage ${getLabel()} records` : 'Modify the content data for this section')}
            {hasDynamicEditor && !shouldShowListView && (
              <span className="admin-badge admin-badge-info" style={{ marginLeft: '0.5rem' }}>
                Dynamic Schema
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {recordId && !entityDefinition?.isSingleton && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => navigate(`/admin/content/${entityType}`)}
            >
              Back to List
            </button>
          )}
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/content')}
          >
            Back to Content
          </button>
        </div>
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
      ) : shouldShowListView ? (
        renderRecordListView()
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
                <h2 className="admin-card-title">
                  {editorMode === 'visual' ? 'Visual Editor' : 'JSON Editor'}
                </h2>
                <div className="admin-editor-mode-toggle">
                  {hasChanges && (
                    <span className="admin-badge admin-badge-warning" style={{ marginRight: '0.75rem' }}>
                      Unsaved Changes
                    </span>
                  )}
                  {hasVisualEditor && (
                    <div className="admin-btn-group">
                      <button
                        className={`admin-btn admin-btn-sm ${editorMode === 'visual' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        onClick={() => handleSwitchMode('visual')}
                      >
                        Visual
                      </button>
                      <button
                        className={`admin-btn admin-btn-sm ${editorMode === 'json' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        onClick={() => handleSwitchMode('json')}
                      >
                        JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-card-body" style={{ padding: editorMode === 'json' ? 0 : undefined }}>
                {editorMode === 'visual' && hasVisualEditor ? renderVisualEditor() : renderJsonEditor()}
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
