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
import { ArrowSyncRegular, OpenRegular } from '@fluentui/react-icons';

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

// Row type for the DataGrid
interface ContentRowItem {
  key: string;
  label: string;
  icon: string;
  record: ContentRecord | undefined;
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

const useStyles = makeStyles({
  // ── Stats row ──
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    position: 'relative' as const,
    paddingTop: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    paddingRight: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
      transform: 'translateY(-1px)',
    },
  },
  // Colored top accent for each stat card
  statAccent1: {
    borderTop: '3px solid #3A66A2',
  },
  statAccent2: {
    borderTop: '3px solid #2d8a4e',
  },
  statAccent3: {
    borderTop: '3px solid #c4820e',
  },
  statAccent4: {
    borderTop: '3px solid #6e56cf',
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.04em',
    lineHeight: '1',
    color: tokens.colorNeutralForeground1,
  },

  // ── Content cards ──
  card: {
    marginBottom: '20px',
    padding: 0,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
    overflow: 'hidden',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '18px',
    paddingBottom: '14px',
    paddingLeft: '24px',
    paddingRight: '24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeaderTitle: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  cardBody: {
    paddingTop: '20px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    paddingRight: '24px',
  },
  cardBodyNoPadding: {
    padding: 0,
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },

  // ── Quick actions ──
  quickActionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },

  // ── Schema chips ──
  schemaChipsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  schemaChip: {
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '16px',
    paddingRight: '16px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    borderRadius: '10px',
    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(16, 24, 40, 0.08)',
      transform: 'translateY(-1px)',
    },
  },
  schemaMoreLink: {
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '16px',
    paddingRight: '16px',
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
  },
  linkNoDecoration: {
    textDecoration: 'none',
  },
  schemaParagraph: {
    marginBottom: '16px',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    lineHeight: '22px',
    letterSpacing: '-0.005em',
  },
  sectionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  alert: {
    marginBottom: '16px',
  },
});

const DashboardPage: React.FC = () => {
  const styles = useStyles();
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

  // Build DataGrid rows
  const gridItems: ContentRowItem[] = contentTypes.map((type) => ({
    key: type.key,
    label: type.label,
    icon: type.icon,
    record: getContentByType(type.key),
  }));

  // DataGrid column definitions
  const columns: TableColumnDefinition<ContentRowItem>[] = [
    createTableColumn<ContentRowItem>({
      columnId: 'section',
      compare: (a, b) => a.label.localeCompare(b.label),
      renderHeaderCell: () => 'Section',
      renderCell: (item) => (
        <span className={styles.sectionCell}>
          <span dangerouslySetInnerHTML={{ __html: item.icon }} />
          <Text weight="semibold">{item.label}</Text>
        </span>
      ),
    }),
    createTableColumn<ContentRowItem>({
      columnId: 'status',
      compare: (a, b) => {
        const statusA = a.record ? (a.record.publishedAt ? 'Published' : 'Draft') : 'Not Created';
        const statusB = b.record ? (b.record.publishedAt ? 'Published' : 'Draft') : 'Not Created';
        return statusA.localeCompare(statusB);
      },
      renderHeaderCell: () => 'Status',
      renderCell: (item) => {
        if (!item.record) {
          return <Badge appearance="tint" color="informative">Not Created</Badge>;
        }
        if (item.record.publishedAt) {
          return <Badge appearance="filled" color="success">Published</Badge>;
        }
        return <Badge appearance="tint" color="warning">Draft</Badge>;
      },
    }),
    createTableColumn<ContentRowItem>({
      columnId: 'version',
      compare: (a, b) => (a.record?.version || 0) - (b.record?.version || 0),
      renderHeaderCell: () => 'Version',
      renderCell: (item) => (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {item.record?.version ? `v${item.record.version}` : '-'}
        </Text>
      ),
    }),
    createTableColumn<ContentRowItem>({
      columnId: 'lastUpdated',
      compare: (a, b) => {
        const dateA = a.record?.updatedAt || '';
        const dateB = b.record?.updatedAt || '';
        return dateA.localeCompare(dateB);
      },
      renderHeaderCell: () => 'Last Updated',
      renderCell: (item) => (
        <Text style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
          {item.record ? formatDate(item.record.updatedAt) : '-'}
        </Text>
      ),
    }),
    createTableColumn<ContentRowItem>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Link to={`/admin/content/${item.key}`} className={styles.linkNoDecoration}>
          <Button appearance="subtle" size="small">
            Edit
          </Button>
        </Link>
      ),
    }),
  ];

  const publishedCount = content.filter((c) => c.publishedAt).length;
  const draftCount = content.filter((c) => !c.publishedAt).length;

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your portfolio content"
      />

      {error && (
        <MessageBar intent="error" className={styles.alert}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.statAccent1}`}>
          <Text className={styles.statLabel} block>Content Types</Text>
          <Text className={styles.statValue} block>{contentTypes.length}</Text>
        </Card>
        <Card className={`${styles.statCard} ${styles.statAccent2}`}>
          <Text className={styles.statLabel} block>Published</Text>
          <Text className={styles.statValue} block>{publishedCount}</Text>
        </Card>
        <Card className={`${styles.statCard} ${styles.statAccent3}`}>
          <Text className={styles.statLabel} block>Drafts</Text>
          <Text className={styles.statValue} block>{draftCount}</Text>
        </Card>
        <Card className={`${styles.statCard} ${styles.statAccent4}`}>
          <Text className={styles.statLabel} block>Total Records</Text>
          <Text className={styles.statValue} block>{content.length}</Text>
        </Card>
      </div>

      {/* Content Overview */}
      <Card className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <Text className={styles.cardHeaderTitle}>Content Sections</Text>
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
        <div className={styles.cardBodyNoPadding}>
          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <Spinner />
            </div>
          ) : (
            <DataGrid
              items={gridItems}
              columns={columns}
              getRowId={(item) => item.key}
              sortable
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<ContentRowItem>>
                {({ item, rowId }) => (
                  <DataGridRow<ContentRowItem> key={rowId}>
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

      {/* Quick Links */}
      <Card className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <Text className={styles.cardHeaderTitle}>Quick Actions</Text>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.quickActionsRow}>
            <Button
              as="a"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              appearance="secondary"
              icon={<OpenRegular />}
              size="small"
            >
              View Portfolio
            </Button>
            <Link to="/admin/content" className={styles.linkNoDecoration}>
              <Button appearance="primary" size="small">Manage Content</Button>
            </Link>
            <Link to="/admin/schema" className={styles.linkNoDecoration}>
              <Button appearance="secondary" size="small">Manage Content Types</Button>
            </Link>
            <Link to="/admin/schema/new" className={styles.linkNoDecoration}>
              <Button appearance="primary" size="small">+ New Content Type</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Dynamic Schema Info */}
      {entityDefinitions.length > 0 && (
        <Card className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <Text className={styles.cardHeaderTitle}>Dynamic Schema</Text>
            <Badge appearance="tint" color="success">Active</Badge>
          </div>
          <div className={styles.cardBody}>
            <Text className={styles.schemaParagraph} block>
              Your CMS is using dynamic content types. You can create and modify content type schemas from the Content Types page.
            </Text>
            <div className={styles.schemaChipsRow}>
              {entityDefinitions.slice(0, 6).map((def) => (
                <Link key={def.id} to={`/admin/schema/${def.id}`} className={styles.linkNoDecoration}>
                  <Card className={styles.schemaChip}>
                    {def.icon && <span>{def.icon}</span>}
                    <Text weight="semibold" size={200}>{def.displayName || def.name}</Text>
                    <Badge appearance="tint" color="informative" size="small">
                      {def.isSingleton ? 'Singleton' : 'Collection'}
                    </Badge>
                  </Card>
                </Link>
              ))}
              {entityDefinitions.length > 6 && (
                <Link to="/admin/schema" className={styles.schemaMoreLink}>
                  +{entityDefinitions.length - 6} more
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

export default DashboardPage;
