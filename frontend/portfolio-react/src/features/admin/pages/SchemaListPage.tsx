import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../components/PageHeader';
import { EntityDefinition } from '../types/entityDefinition';
import {
  Button, Badge, Card, Spinner, Text,
  MessageBar, MessageBarBody,
  DataGrid, DataGridHeader, DataGridRow, DataGridHeaderCell, DataGridBody, DataGridCell,
  TableColumnDefinition, createTableColumn,
  makeStyles, tokens,
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular } from '@fluentui/react-icons';

const GET_ALL_ENTITY_DEFINITIONS = gql`
  query GetAllEntityDefinitions {
    allEntityDefinitions {
      id
      name
      displayName
      description
      icon
      isSingleton
      category
      version
      createdAt
      updatedAt
      attributes {
        id
        name
        type
      }
    }
  }
`;

const DELETE_ENTITY_DEFINITION = gql`
  mutation DeleteEntityDefinition($id: UUID!) {
    deleteEntityDefinition(id: $id)
  }
`;

const useStyles = makeStyles({
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '12px',
  },
  emptyStateCard: {
    padding: '56px 48px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    gap: '6px',
    padding: '24px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    lineHeight: '1.5',
  },
  emptyStateButton: {
    marginTop: '20px',
  },
  categoryGroup: {
    marginBottom: '32px',
  },
  categoryTitle: {
    display: 'block',
    marginBottom: '12px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: tokens.colorNeutralForeground3,
  },
  tableCard: {
    padding: '0',
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
  },
  actionsCell: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  codeName: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    letterSpacing: '-0.01em',
  },
  displayName: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  iconSpan: {
    fontSize: '16px',
    lineHeight: 1,
  },
  dangerButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
  errorBar: {
    marginBottom: '16px',
  },
  dataGrid: {
    width: '100%',
  },
  fieldCount: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '12px',
  },
  dateText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
});

const SchemaListPage: React.FC = () => {
  const navigate = useNavigate();
  const styles = useStyles();
  const [definitions, setDefinitions] = useState<EntityDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchDefinitions = async () => {
    try {
      setIsLoading(true);
      const client = getClient();
      const { data } = await client.query({
        query: GET_ALL_ENTITY_DEFINITIONS,
        fetchPolicy: 'network-only',
      });

      setDefinitions(data?.allEntityDefinitions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch entity definitions:', err);
      setError('Failed to load content types. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const client = getClient();
      const token = getAuthToken();

      await client.mutate({
        mutation: DELETE_ENTITY_DEFINITION,
        variables: { id },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      });

      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete entity definition:', err);
      setError('Failed to delete content type.');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group definitions by category
  const groupedDefinitions = definitions.reduce<Record<string, EntityDefinition[]>>(
    (acc, def) => {
      const category = def.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(def);
      return acc;
    },
    {}
  );

  const columns: TableColumnDefinition<EntityDefinition>[] = [
    createTableColumn<EntityDefinition>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <span className={styles.codeName}>{item.name}</span>
      ),
    }),
    createTableColumn<EntityDefinition>({
      columnId: 'displayName',
      compare: (a, b) => (a.displayName || '').localeCompare(b.displayName || ''),
      renderHeaderCell: () => 'Display Name',
      renderCell: (item) => (
        <div className={styles.displayName}>
          {item.icon && <span className={styles.iconSpan}>{item.icon}</span>}
          <Text weight="semibold">{item.displayName || '-'}</Text>
        </div>
      ),
    }),
    createTableColumn<EntityDefinition>({
      columnId: 'fields',
      compare: (a, b) => a.attributes.length - b.attributes.length,
      renderHeaderCell: () => 'Fields',
      renderCell: (item) => (
        <Badge appearance="tint" color="informative">
          <span className={styles.fieldCount}>{item.attributes.length}</span> fields
        </Badge>
      ),
    }),
    createTableColumn<EntityDefinition>({
      columnId: 'type',
      compare: (a, b) => Number(a.isSingleton) - Number(b.isSingleton),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <Badge appearance="tint" color={item.isSingleton ? 'warning' : 'success'}>
          {item.isSingleton ? 'Singleton' : 'Collection'}
        </Badge>
      ),
    }),
    createTableColumn<EntityDefinition>({
      columnId: 'updated',
      compare: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      renderHeaderCell: () => 'Updated',
      renderCell: (item) => (
        <Text className={styles.dateText}>{formatDate(item.updatedAt)}</Text>
      ),
    }),
    createTableColumn<EntityDefinition>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <div className={styles.actionsCell}>
          {deleteConfirm === item.id ? (
            <>
              <Button
                size="small"
                className={styles.dangerButton}
                onClick={() => handleDelete(item.id)}
              >
                Confirm
              </Button>
              <Button
                size="small"
                appearance="subtle"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                appearance="subtle"
                icon={<EditRegular />}
                onClick={() => navigate(`/admin/schema/${item.id}`)}
              >
                Edit
              </Button>
              <Button
                size="small"
                appearance="subtle"
                icon={<DeleteRegular />}
                onClick={() => setDeleteConfirm(item.id)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    }),
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Content Types"
        subtitle={`Manage your CMS content type schemas${definitions.length > 0 ? ` \u00b7 ${definitions.length} type${definitions.length !== 1 ? 's' : ''}` : ''}`}
        actions={
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={() => navigate('/admin/schema/new')}
          >
            New Content Type
          </Button>
        }
      />

      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
          <Text>Loading content types...</Text>
        </div>
      ) : definitions.length === 0 ? (
        <Card className={styles.emptyStateCard}>
          <div className={styles.emptyState}>
            <Text className={styles.emptyTitle}>No Content Types</Text>
            <Text className={styles.emptySubtitle}>
              Create your first content type to start building dynamic content.
            </Text>
            <Button
              appearance="primary"
              className={styles.emptyStateButton}
              onClick={() => navigate('/admin/schema/new')}
            >
              Create Content Type
            </Button>
          </div>
        </Card>
      ) : (
        Object.entries(groupedDefinitions).map(([category, defs]) => (
          <div key={category} className={styles.categoryGroup}>
            {Object.keys(groupedDefinitions).length > 1 && (
              <Text className={styles.categoryTitle}>{category}</Text>
            )}
            <Card className={styles.tableCard}>
              <DataGrid
                items={defs}
                columns={columns}
                getRowId={(item) => item.id}
                sortable
                className={styles.dataGrid}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<EntityDefinition>>
                  {({ item, rowId }) => (
                    <DataGridRow<EntityDefinition> key={rowId}>
                      {({ renderCell }) => (
                        <DataGridCell>{renderCell(item)}</DataGridCell>
                      )}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>
            </Card>
          </div>
        ))
      )}
    </AdminLayout>
  );
};

export default SchemaListPage;
