import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { getAuthToken } from '../auth/AuthContext';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../components/PageHeader';
import { FormInput, FormTextarea, FormSelect, ArrayField } from '../components/form';
import { AttributeDefinition, EntityDefinition } from '../types/entityDefinition';
import {
  Button, Card, Checkbox, Spinner, Text,
  MessageBar, MessageBarBody,
  makeStyles, tokens,
} from '@fluentui/react-components';
import { SaveRegular, ArrowLeftRegular } from '@fluentui/react-icons';

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

const useStyles = makeStyles({
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '12px',
  },
  editorContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '28px',
    alignItems: 'start',
  },
  editorMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  editorSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'sticky' as const,
    top: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
  },
  cardHeader: {
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeaderTitle: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: tokens.colorNeutralForeground3,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
  },
  marginTopSm: {
    marginTop: '10px',
  },
  marginTopM: {
    marginTop: '20px',
  },
  alert: {
    marginBottom: '12px',
  },
  sidebarActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  schemaPreview: {
    fontSize: '11px',
    fontFamily: tokens.fontFamilyMonospace,
    backgroundColor: '#1a1e2e',
    color: '#c4cedd',
    padding: '16px',
    borderRadius: '8px',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '320px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.7',
    letterSpacing: '0.01em',
  },
  attributeEditor: {
    display: 'flex',
    flexDirection: 'column',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
});

const SchemaEditorPage: React.FC = () => {
  const styles = useStyles();
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
      <div className={styles.attributeEditor} style={{ paddingLeft: depth > 0 ? '1rem' : 0 }}>
        <div className={styles.grid2}>
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

        <div className={`${styles.grid2} ${styles.marginTopSm}`}>
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

        <div className={styles.marginTopSm}>
          <FormInput
            label="Help Text"
            value={attr.helpText || ''}
            onChange={(v) => updateAttr('helpText', v)}
            placeholder="Help text shown below the field"
          />
        </div>

        <div className={styles.marginTopSm}>
          <Checkbox
            label="Required field"
            checked={attr.isRequired}
            onChange={(_e, data) => updateAttr('isRequired', !!data.checked)}
          />
        </div>

        {/* Select options */}
        {attr.type === 'select' && (
          <div className={styles.marginTopM}>
            <ArrayField
              label="Options"
              items={attr.options || []}
              onChange={(options) => updateAttr('options', options)}
              createItem={() => ({ value: '', label: '' })}
              itemLabel={(item) => item.label || item.value || 'New Option'}
              renderItem={(item, idx, onItemChange) => (
                <div className={styles.optionsGrid}>
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
          <div className={styles.marginTopSm}>
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
          <div className={styles.marginTopM}>
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
      <PageHeader
        title={isNew ? 'New Content Type' : `Edit: ${formData.displayName || formData.name}`}
        subtitle="Define the schema for your content type"
        actions={
          <Button
            appearance="subtle"
            size="small"
            icon={<ArrowLeftRegular />}
            onClick={() => navigate('/admin/schema')}
          >
            Back to Content Types
          </Button>
        }
      />

      {error && (
        <div className={styles.alert}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      {success && (
        <div className={styles.alert}>
          <MessageBar intent="success">
            <MessageBarBody>{success}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
          <Text>Loading content type...</Text>
        </div>
      ) : (
        <div className={styles.editorContainer}>
          <div className={styles.editorMain}>
            {/* Basic Info */}
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardHeaderTitle}>Basic Information</Text>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.grid2}>
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

                <div className={styles.marginTopM}>
                  <FormTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(v) => updateField('description', v)}
                    placeholder="Describe what this content type is for..."
                    rows={2}
                  />
                </div>

                <div className={`${styles.grid3} ${styles.marginTopM}`}>
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
            </Card>

            {/* Fields */}
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardHeaderTitle}>Fields</Text>
              </div>
              <div className={styles.cardBody}>
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
            </Card>
          </div>

          <div className={styles.editorSidebar}>
            {/* Actions */}
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardHeaderTitle}>Actions</Text>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.sidebarActions}>
                  <Button
                    appearance="primary"
                    icon={<SaveRegular />}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : isNew ? 'Create Content Type' : 'Save Changes'}
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => navigate('/admin/schema')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>

            {/* Preview */}
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardHeaderTitle}>Schema Preview</Text>
              </div>
              <div className={styles.cardBody}>
                <pre className={styles.schemaPreview}>
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
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SchemaEditorPage;
