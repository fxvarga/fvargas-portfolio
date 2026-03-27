import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../components/PageHeader';
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
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  TabList,
  Tab,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SaveRegular,
  SendRegular,
  OpenRegular,
  ArrowLeftRegular,
} from '@fluentui/react-icons';

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

// Styles
const useStyles = makeStyles({
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center',
    paddingTop: '56px',
    paddingBottom: '56px',
    paddingLeft: '24px',
    paddingRight: '24px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
    marginBottom: '6px',
  },
  emptySubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
  editorContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  editorMain: {
    minWidth: 0,
  },
  editorSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky' as const,
    top: '24px',
    alignSelf: 'start',
    '@media (max-width: 1024px)': {
      position: 'static' as const,
    },
  },
  editorCard: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
    overflow: 'hidden',
  },
  sidebarCard: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardHeaderTitle: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '-0.005em',
    color: tokens.colorNeutralForeground1,
    textTransform: 'uppercase' as const,
  },
  modeToggleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  sidebarActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoBlock: {
    fontSize: tokens.fontSizeBase200,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  infoValue: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  jsonEditorWrapper: {
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    backgroundColor: '#1a1e2e',
    color: '#e2e8f0',
    borderRadius: '0 0 12px 12px',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    minHeight: '400px',
    overflow: 'auto',
  },
  jsonTextarea: {
    width: '100%',
    minHeight: '400px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
  },
  cardBody: {
    paddingTop: '16px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  cardBodyNoPadding: {
    padding: '0',
  },
  messageBarSpacing: {
    marginBottom: '12px',
  },
  recordIdText: {
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
  },
  dataGridEditLink: {
    textDecoration: 'none',
  },
  listCard: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
    overflow: 'hidden',
  },
  previewButton: {
    width: '100%',
  },
});

// DataGrid column definitions for the record list
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

const ContentEditorPage: React.FC = () => {
  const { entityType, recordId } = useParams<{ entityType: string; recordId?: string }>();
  const navigate = useNavigate();
  const styles = useStyles();

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
    if (data.storeName && typeof data.storeName === 'string') return data.storeName;
    return rec.id.substring(0, 8) + '...';
  };

  // Check if we should show the list view (non-singleton with multiple records and no recordId)
  const shouldShowListView = !recordId &&
    entityDefinition &&
    !entityDefinition.isSingleton &&
    allRecords.length > 1;

  // DataGrid columns for record list
  const recordColumns: TableColumnDefinition<ContentRecord>[] = [
    createTableColumn<ContentRecord>({
      columnId: 'title',
      compare: (a, b) => getRecordTitle(a).localeCompare(getRecordTitle(b)),
      renderHeaderCell: () => 'Title',
      renderCell: (item) => (
        <div>
          <Text weight="semibold">{getRecordTitle(item)}</Text>
          <br />
          <Text className={styles.recordIdText} size={200}>
            {item.id.substring(0, 8)}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ContentRecord>({
      columnId: 'status',
      compare: (a, b) => (a.publishedAt ? 1 : 0) - (b.publishedAt ? 1 : 0),
      renderHeaderCell: () => 'Status',
      renderCell: (item) =>
        item.publishedAt ? (
          <Badge appearance="filled" color="success">Published</Badge>
        ) : (
          <Badge appearance="tint" color="warning">Draft</Badge>
        ),
    }),
    createTableColumn<ContentRecord>({
      columnId: 'version',
      compare: (a, b) => a.version - b.version,
      renderHeaderCell: () => 'Version',
      renderCell: (item) => <Text style={{ color: tokens.colorNeutralForeground3 }}>v{item.version}</Text>,
    }),
    createTableColumn<ContentRecord>({
      columnId: 'updated',
      compare: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      renderHeaderCell: () => 'Updated',
      renderCell: (item) => (
        <Text style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
          {formatDate(item.updatedAt)}
        </Text>
      ),
    }),
    createTableColumn<ContentRecord>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Link to={`/admin/content/${entityType}/${item.id}`} className={styles.dataGridEditLink}>
          <Button appearance="subtle" size="small">Edit</Button>
        </Link>
      ),
    }),
  ];

  const renderRecordListView = () => (
    <Card className={styles.listCard}>
      <CardHeader
        header={
          <div className={styles.cardHeaderRow}>
            <Text className={styles.cardHeaderTitle}>{getLabel()} Records</Text>
            <Badge appearance="tint" color="informative">{allRecords.length} records</Badge>
          </div>
        }
      />
      <div className={styles.cardBodyNoPadding}>
        <DataGrid
          items={allRecords}
          columns={recordColumns}
          sortable
          getRowId={(item) => item.id}
        >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<ContentRecord>>
            {({ item, rowId }) => (
              <DataGridRow<ContentRecord> key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>
    </Card>
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
    <div className={styles.jsonEditorWrapper}>
      <textarea
        className={styles.jsonTextarea}
        value={jsonData}
        onChange={(e) => handleJsonChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );

  return (
    <AdminLayout>
      {/* Header */}
      <PageHeader
        title={shouldShowListView ? getLabel() : `Edit ${getLabel()}`}
        subtitle={entityDefinition?.description || (shouldShowListView ? `Manage ${getLabel()} records` : 'Modify the content data for this section')}
        badge={hasDynamicEditor && !shouldShowListView ? { label: 'Dynamic Schema', color: 'informative' } : undefined}
        actions={
          <>
            {recordId && !entityDefinition?.isSingleton && (
              <Button
                appearance="secondary"
                size="small"
                icon={<ArrowLeftRegular />}
                onClick={() => navigate(`/admin/content/${entityType}`)}
              >
                Back to List
              </Button>
            )}
            <Button
              appearance="secondary"
              size="small"
              icon={<ArrowLeftRegular />}
              onClick={() => navigate('/admin/content')}
            >
              All Content
            </Button>
          </>
        }
      />

      {/* Error message */}
      {error && (
        <div className={styles.messageBarSpacing}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className={styles.messageBarSpacing}>
          <MessageBar intent="success">
            <MessageBarBody>{success}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Text style={{ color: tokens.colorNeutralForeground3 }}>Loading content...</Text>
        </div>
      ) : shouldShowListView ? (
        renderRecordListView()
      ) : !record ? (
        /* Empty state */
        <Card className={styles.editorCard}>
          <div className={styles.emptyState}>
            <Text className={styles.emptyTitle} block>No Content Found</Text>
            <Text className={styles.emptySubtitle} block>
              No {getLabel()} content exists yet. The content will be created when the database is seeded.
            </Text>
          </div>
        </Card>
      ) : (
        /* Editor layout */
        <div className={styles.editorContainer}>
          {/* Main editor area */}
          <div className={styles.editorMain}>
            <Card className={styles.editorCard}>
              <CardHeader
                header={
                  <div className={styles.cardHeaderRow}>
                    <Text className={styles.cardHeaderTitle}>
                      {editorMode === 'visual' ? 'Visual Editor' : 'JSON Editor'}
                    </Text>
                    <div className={styles.modeToggleArea}>
                      {hasChanges && (
                        <Badge appearance="tint" color="warning" size="small">
                          Unsaved
                        </Badge>
                      )}
                      {hasVisualEditor && (
                        <TabList
                          selectedValue={editorMode}
                          onTabSelect={(_e, data) => handleSwitchMode(data.value as EditorMode)}
                          size="small"
                        >
                          <Tab value="visual">Visual</Tab>
                          <Tab value="json">JSON</Tab>
                        </TabList>
                      )}
                    </div>
                  </div>
                }
              />
              <div className={editorMode === 'json' ? styles.cardBodyNoPadding : styles.cardBody}>
                {editorMode === 'visual' && hasVisualEditor ? renderVisualEditor() : renderJsonEditor()}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className={styles.editorSidebar}>
            {/* Actions Card */}
            <Card className={styles.sidebarCard}>
              <CardHeader header={<Text className={styles.cardHeaderTitle}>Actions</Text>} />
              <div className={styles.cardBody}>
                <div className={styles.sidebarActions}>
                  <Button
                    appearance="primary"
                    icon={<SaveRegular />}
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    size="small"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>

                  <Button
                    appearance="secondary"
                    icon={<SendRegular />}
                    onClick={handleSaveAndPublish}
                    disabled={isSaving}
                    size="small"
                  >
                    {isSaving ? 'Saving...' : 'Save & Publish'}
                  </Button>

                  {!record.publishedAt && (
                    <Button
                      appearance="subtle"
                      icon={<SendRegular />}
                      onClick={handlePublish}
                      disabled={isPublishing || hasChanges}
                      size="small"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Current'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className={styles.sidebarCard}>
              <CardHeader header={<Text className={styles.cardHeaderTitle}>Details</Text>} />
              <div className={styles.cardBody}>
                <div className={styles.infoBlock}>
                  <div className={styles.infoItem}>
                    <Text className={styles.infoLabel}>Status</Text>
                    {record.publishedAt ? (
                      <Badge appearance="filled" color="success">Published</Badge>
                    ) : (
                      <Badge appearance="tint" color="warning">Draft</Badge>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <Text className={styles.infoLabel}>Version</Text>
                    <Text className={styles.infoValue}>{record.version}</Text>
                  </div>
                  <div className={styles.infoItem}>
                    <Text className={styles.infoLabel}>Published</Text>
                    <Text className={styles.infoValue}>{formatDate(record.publishedAt)}</Text>
                  </div>
                  <div className={styles.infoItem}>
                    <Text className={styles.infoLabel}>Last Updated</Text>
                    <Text className={styles.infoValue}>{formatDate(record.updatedAt)}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Preview Card */}
            <Card className={styles.sidebarCard}>
              <div className={styles.cardBody}>
                <Button
                  appearance="subtle"
                  icon={<OpenRegular />}
                  as="a"
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.previewButton}
                  size="small"
                >
                  Preview Site
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ContentEditorPage;
