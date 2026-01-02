import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import { FormInput, FormTextarea, FormSelect, ArrayField } from '../components/form';
import { AttributeDefinition, EntityDefinition } from '../types/entityDefinition';
import '../styles/admin.css';

const GET_ENTITY_DEFINITION = gql`
  query GetEntityDefinition($id: UUID!) {
    entityDefinitionById(id: $id) {
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
          children {
            id
            name
            type
            isRequired
            label
            order
          }
        }
      }
    }
  }
`;

const CREATE_ENTITY_DEFINITION = gql`
  mutation CreateEntityDefinition($input: CreateEntityInput!) {
    createEntityDefinition(input: $input)
  }
`;

const UPDATE_ENTITY_DEFINITION = gql`
  mutation UpdateEntityDefinition($input: UpdateEntityDefinitionInput!) {
    updateEntityDefinition(input: $input)
  }
`;

const FIELD_TYPES = [
  { value: 'string', label: 'Text (single line)' },
  { value: 'text', label: 'Text (multi-line)' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (checkbox)' },
  { value: 'image', label: 'Image (url + alt)' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'tags', label: 'Tags (string array)' },
  { value: 'array', label: 'Array (of objects)' },
  { value: 'object', label: 'Object (nested fields)' },
  { value: 'reference', label: 'Reference (to another entity)' },
];

const createEmptyAttribute = (): AttributeDefinition => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'string',
  isRequired: false,
  label: '',
  helpText: '',
  placeholder: '',
  order: 0,
});

interface FormData {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isSingleton: boolean;
  category: string;
  attributes: AttributeDefinition[];
}

const SchemaEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    isSingleton: true,
    category: 'Content',
    attributes: [],
  });
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDefinition = useCallback(async () => {
    if (isNew || !id) return;

    try {
      setIsLoading(true);
      const client = getClient();
      const { data } = await client.query({
        query: GET_ENTITY_DEFINITION,
        variables: { id },
        fetchPolicy: 'network-only',
      });

      if (data?.entityDefinitionById) {
        const def = data.entityDefinitionById as EntityDefinition;
        setFormData({
          name: def.name,
          displayName: def.displayName || '',
          description: def.description || '',
          icon: def.icon || '',
          isSingleton: def.isSingleton,
          category: def.category || 'Content',
          attributes: def.attributes || [],
        });
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch entity definition:', err);
      setError('Failed to load content type.');
    } finally {
      setIsLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchDefinition();
  }, [fetchDefinition]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!/^[a-z][a-z0-9-]*$/.test(formData.name)) {
      setError('Name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const client = getClient();
      const token = getAuthToken();

      // Prepare attributes with proper order
      const attributesInput = formData.attributes.map((attr, index) => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        isRequired: attr.isRequired,
        label: attr.label || null,
        helpText: attr.helpText || null,
        placeholder: attr.placeholder || null,
        defaultValue: attr.defaultValue || null,
        targetEntity: attr.targetEntity || null,
        validation: attr.validation || null,
        order: index,
        options: attr.options?.map(o => ({ value: o.value, label: o.label })) || null,
        children: attr.children?.map((child, childIndex) => ({
          id: child.id,
          name: child.name,
          type: child.type,
          isRequired: child.isRequired,
          label: child.label || null,
          helpText: child.helpText || null,
          placeholder: child.placeholder || null,
          order: childIndex,
          options: child.options?.map(o => ({ value: o.value, label: o.label })) || null,
          children: child.children?.map((gc, gcIndex) => ({
            id: gc.id,
            name: gc.name,
            type: gc.type,
            isRequired: gc.isRequired,
            label: gc.label || null,
            order: gcIndex,
          })) || null,
        })) || null,
      }));

      if (isNew) {
        const { data } = await client.mutate({
          mutation: CREATE_ENTITY_DEFINITION,
          variables: {
            input: {
              name: formData.name,
              displayName: formData.displayName || null,
              description: formData.description || null,
              icon: formData.icon || null,
              isSingleton: formData.isSingleton,
              category: formData.category || null,
              attributes: attributesInput,
            },
          },
          context: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        });

        setSuccess('Content type created successfully!');
        // Navigate to the edit page for the new entity
        setTimeout(() => navigate(`/admin/schema/${data.createEntityDefinition}`), 1000);
      } else {
        await client.mutate({
          mutation: UPDATE_ENTITY_DEFINITION,
          variables: {
            input: {
              id,
              name: formData.name,
              displayName: formData.displayName || null,
              description: formData.description || null,
              icon: formData.icon || null,
              isSingleton: formData.isSingleton,
              category: formData.category || null,
              attributes: attributesInput,
            },
          },
          context: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        });

        setSuccess('Content type updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save entity definition:', err);
      setError('Failed to save content type. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const renderAttributeEditor = (
    attr: AttributeDefinition,
    index: number,
    onChange: (attr: AttributeDefinition) => void,
    depth: number = 0
  ) => {
    const updateAttr = <K extends keyof AttributeDefinition>(
      field: K,
      value: AttributeDefinition[K]
    ) => {
      onChange({ ...attr, [field]: value });
    };

    return (
      <div className="admin-attribute-editor" style={{ paddingLeft: depth > 0 ? '1rem' : 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormInput
            label="Field Name"
            value={attr.name}
            onChange={(v) => updateAttr('name', v)}
            placeholder="fieldName"
            helpText="Use camelCase, no spaces"
            required
          />
          <FormSelect
            label="Field Type"
            value={attr.type}
            onChange={(v) => updateAttr('type', v as AttributeDefinition['type'])}
            options={FIELD_TYPES}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <FormInput
            label="Display Label"
            value={attr.label || ''}
            onChange={(v) => updateAttr('label', v)}
            placeholder="Field Label"
          />
          <FormInput
            label="Placeholder"
            value={attr.placeholder || ''}
            onChange={(v) => updateAttr('placeholder', v)}
            placeholder="Placeholder text..."
          />
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <FormInput
            label="Help Text"
            value={attr.helpText || ''}
            onChange={(v) => updateAttr('helpText', v)}
            placeholder="Help text shown below the field"
          />
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={attr.isRequired}
              onChange={(e) => updateAttr('isRequired', e.target.checked)}
            />
            <span>Required field</span>
          </label>
        </div>

        {/* Select options */}
        {attr.type === 'select' && (
          <div style={{ marginTop: '1rem' }}>
            <ArrayField
              label="Options"
              items={attr.options || []}
              onChange={(options) => updateAttr('options', options)}
              createItem={() => ({ value: '', label: '' })}
              itemLabel={(item) => item.label || item.value || 'New Option'}
              renderItem={(item, idx, onItemChange) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormInput
                    label="Value"
                    value={item.value}
                    onChange={(v) => onItemChange({ ...item, value: v })}
                    placeholder="option-value"
                  />
                  <FormInput
                    label="Label"
                    value={item.label}
                    onChange={(v) => onItemChange({ ...item, label: v })}
                    placeholder="Option Label"
                  />
                </div>
              )}
            />
          </div>
        )}

        {/* Reference target entity */}
        {attr.type === 'reference' && (
          <div style={{ marginTop: '0.5rem' }}>
            <FormInput
              label="Target Entity"
              value={attr.targetEntity || ''}
              onChange={(v) => updateAttr('targetEntity', v)}
              placeholder="entity-name"
              helpText="The name of the entity this field references"
            />
          </div>
        )}

        {/* Nested children for array/object types */}
        {(attr.type === 'array' || attr.type === 'object') && depth < 2 && (
          <div style={{ marginTop: '1rem' }}>
            <ArrayField
              label={attr.type === 'array' ? 'Array Item Fields' : 'Object Fields'}
              items={attr.children || []}
              onChange={(children) => updateAttr('children', children)}
              createItem={createEmptyAttribute}
              itemLabel={(item) => item.label || item.name || 'New Field'}
              renderItem={(child, idx, onChildChange) =>
                renderAttributeEditor(child, idx, onChildChange, depth + 1)
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{isNew ? 'New Content Type' : `Edit: ${formData.displayName || formData.name}`}</h1>
          <p>Define the schema for your content type</p>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => navigate('/admin/schema')}
        >
          Back to Content Types
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
          <p>Loading content type...</p>
        </div>
      ) : (
        <div className="admin-editor-container">
          <div className="admin-editor-main">
            {/* Basic Info */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Basic Information</h2>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormInput
                    label="Name (slug)"
                    value={formData.name}
                    onChange={(v) => updateField('name', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="my-content-type"
                    helpText="Lowercase, hyphens only. Used in URLs and API."
                    required
                    disabled={!isNew}
                  />
                  <FormInput
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(v) => updateField('displayName', v)}
                    placeholder="My Content Type"
                    helpText="Human-readable name shown in admin UI"
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <FormTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(v) => updateField('description', v)}
                    placeholder="Describe what this content type is for..."
                    rows={2}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <FormInput
                    label="Icon"
                    value={formData.icon}
                    onChange={(v) => updateField('icon', v)}
                    placeholder="e.g. emoji or icon code"
                  />
                  <FormInput
                    label="Category"
                    value={formData.category}
                    onChange={(v) => updateField('category', v)}
                    placeholder="Content"
                    helpText="For grouping in navigation"
                  />
                  <FormSelect
                    label="Type"
                    value={formData.isSingleton ? 'singleton' : 'collection'}
                    onChange={(v) => updateField('isSingleton', v === 'singleton')}
                    options={[
                      { value: 'singleton', label: 'Singleton (one record)' },
                      { value: 'collection', label: 'Collection (many records)' },
                    ]}
                    helpText="Singleton = one record, Collection = many"
                  />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Fields</h2>
              </div>
              <div className="admin-card-body">
                <ArrayField
                  label=""
                  items={formData.attributes}
                  onChange={(attrs) => updateField('attributes', attrs)}
                  createItem={createEmptyAttribute}
                  itemLabel={(item) => item.label || item.name || 'New Field'}
                  renderItem={(attr, index, onAttrChange) =>
                    renderAttributeEditor(attr, index, onAttrChange, 0)
                  }
                />
              </div>
            </div>
          </div>

          <div className="admin-editor-sidebar">
            {/* Actions */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Actions</h2>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-full"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : isNew ? 'Create Content Type' : 'Save Changes'}
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary admin-btn-full"
                    onClick={() => navigate('/admin/schema')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Schema Preview</h2>
              </div>
              <div className="admin-card-body">
                <pre style={{ 
                  fontSize: '0.75rem', 
                  background: 'var(--admin-bg)', 
                  padding: '0.5rem', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(
                    {
                      name: formData.name,
                      displayName: formData.displayName,
                      isSingleton: formData.isSingleton,
                      fields: formData.attributes.map((a) => ({
                        name: a.name,
                        type: a.type,
                        required: a.isRequired,
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SchemaEditorPage;
