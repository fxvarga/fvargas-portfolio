import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../components/PageHeader';
import {
  Button,
  Badge,
  Card,
  Dropdown,
  Option,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
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
import { ArrowSyncRegular } from '@fluentui/react-icons';

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

const useStyles = makeStyles({
  card: {
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '18px',
    paddingBottom: '14px',
    paddingLeft: '24px',
    paddingRight: '24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cardHeaderTitle: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  cardBody: {
    padding: '0',
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    padding: '40px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px 24px',
    gap: '10px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  emptySubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
  typeCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  typeMuted: {
    color: tokens.colorNeutralForeground4,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '11px',
  },
  grid: {
    width: '100%',
  },
  errorBar: {
    marginBottom: '16px',
  },
  filterDropdown: {
    minWidth: '160px',
  },
  dateText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
});

const ContentListPage: React.FC = () => {
  const styles = useStyles();
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

  const columns: TableColumnDefinition<ContentRecord>[] = [
    createTableColumn<ContentRecord>({
      columnId: 'type',
      compare: (a, b) => getLabel(a.entityType).localeCompare(getLabel(b.entityType)),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <div className={styles.typeCell}>
          <Text weight="semibold">{getLabel(item.entityType)}</Text>
          <Text className={styles.typeMuted}>
            {item.id.substring(0, 8)}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ContentRecord>({
      columnId: 'status',
      compare: (a, b) => {
        const aStatus = a.publishedAt ? 'Published' : 'Draft';
        const bStatus = b.publishedAt ? 'Published' : 'Draft';
        return aStatus.localeCompare(bStatus);
      },
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
      renderCell: (item) => (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>v{item.version}</Text>
      ),
    }),
    createTableColumn<ContentRecord>({
      columnId: 'published',
      compare: (a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return aDate - bDate;
      },
      renderHeaderCell: () => 'Published',
      renderCell: (item) => <Text className={styles.dateText}>{formatDate(item.publishedAt)}</Text>,
    }),
    createTableColumn<ContentRecord>({
      columnId: 'updated',
      compare: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      renderHeaderCell: () => 'Updated',
      renderCell: (item) => <Text className={styles.dateText}>{formatDate(item.updatedAt)}</Text>,
    }),
    createTableColumn<ContentRecord>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Link to={getEditLink(item)} style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small">
            Edit
          </Button>
        </Link>
      ),
    }),
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Content"
        subtitle={`${filteredContent.length} record${filteredContent.length !== 1 ? 's' : ''}`}
      />

      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <Text className={styles.cardHeaderTitle}>All Content</Text>
            <Dropdown
              className={styles.filterDropdown}
              value={filter === 'all' ? 'All Types' : (contentTypeLabels[filter] || filter)}
              selectedOptions={[filter]}
              onOptionSelect={(_e, data) => setFilter(data.optionValue ?? 'all')}
              size="small"
            >
              <Option value="all">All Types</Option>
              {entityDefinitions.map((def) => (
                <Option key={def.name} value={def.name}>
                  {def.displayName || def.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          <Button
            appearance="subtle"
            size="small"
            icon={<ArrowSyncRegular />}
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        <div className={styles.cardBody}>
          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <Spinner label="Loading content..." />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className={styles.emptyState}>
              <Text className={styles.emptyTitle}>No content found</Text>
              <Text className={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'No content records exist yet.'
                  : `No ${getLabel(filter)} records found.`}
              </Text>
            </div>
          ) : (
            <DataGrid
              items={filteredContent}
              columns={columns}
              sortable
              getRowId={(item) => item.id}
              className={styles.grid}
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
          )}
        </div>
      </Card>
    </AdminLayout>
  );
};

export default ContentListPage;
