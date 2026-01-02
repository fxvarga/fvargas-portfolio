import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import { EntityDefinition } from '../types/entityDefinition';
import '../styles/admin.css';

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

const SchemaListPage: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <AdminLayout>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Content Types</h1>
          <p>Manage your CMS content type schemas</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => navigate('/admin/schema/new')}
        >
          + New Content Type
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">{error}</div>
      )}

      {isLoading ? (
        <div className="admin-loading-container" style={{ minHeight: '400px' }}>
          <div className="admin-loading-spinner"></div>
          <p>Loading content types...</p>
        </div>
      ) : definitions.length === 0 ? (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-empty-state">
              <h3>No Content Types</h3>
              <p>Create your first content type to start building dynamic content.</p>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => navigate('/admin/schema/new')}
                style={{ marginTop: '1rem' }}
              >
                Create Content Type
              </button>
            </div>
          </div>
        </div>
      ) : (
        Object.entries(groupedDefinitions).map(([category, defs]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            {Object.keys(groupedDefinitions).length > 1 && (
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
                {category}
              </h2>
            )}
            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Fields</th>
                    <th>Type</th>
                    <th>Updated</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {defs.map((def) => (
                    <tr key={def.id}>
                      <td>
                        <code style={{ fontSize: '0.875rem' }}>{def.name}</code>
                      </td>
                      <td>
                        {def.icon && <span style={{ marginRight: '0.5rem' }}>{def.icon}</span>}
                        {def.displayName || '-'}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-info">
                          {def.attributes.length} fields
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${def.isSingleton ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                          {def.isSingleton ? 'Singleton' : 'Collection'}
                        </span>
                      </td>
                      <td>{formatDate(def.updatedAt)}</td>
                      <td>
                        {deleteConfirm === def.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => handleDelete(def.id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                              onClick={() => navigate(`/admin/schema/${def.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => setDeleteConfirm(def.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </AdminLayout>
  );
};

export default SchemaListPage;
