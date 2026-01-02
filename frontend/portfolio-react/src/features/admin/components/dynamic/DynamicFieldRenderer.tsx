import React from 'react';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  ImagePicker,
  FieldGroup,
  ArrayField,
  TagInput,
} from '../form';
import {
  AttributeDefinition,
  getAttributeLabel,
  isSimpleArray,
  createDefaultArrayItem,
  ValidationError,
} from '../../types/entityDefinition';

interface DynamicFieldRendererProps {
  attribute: AttributeDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  path?: string; // For debugging/error messages
  errors?: ValidationError[]; // Validation errors for this field
}

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  attribute,
  value,
  onChange,
  path = '',
  errors = [],
}) => {
  const label = getAttributeLabel(attribute);
  const fieldPath = path ? `${path}.${attribute.name}` : attribute.name;
  
  // Get direct errors for this field (exact match)
  const directErrors = errors.filter((e) => e.field === fieldPath);
  const hasError = directErrors.length > 0;
  const errorMessage = directErrors.map((e) => e.message).join('; ');

  // Helper to wrap fields with error styling
  const wrapWithError = (element: React.ReactNode) => {
    if (!hasError) return element;
    return (
      <div className="admin-field-with-error">
        {element}
        <span className="admin-field-error">{errorMessage}</span>
      </div>
    );
  };

  switch (attribute.type) {
    case 'string':
      return (
        <FormInput
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
          placeholder={attribute.placeholder}
          helpText={attribute.helpText}
          required={attribute.isRequired}
          error={errorMessage || undefined}
        />
      );

    case 'text':
    case 'richtext':
      return (
        <FormTextarea
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
          placeholder={attribute.placeholder}
          helpText={attribute.helpText}
          required={attribute.isRequired}
          rows={attribute.type === 'richtext' ? 8 : 4}
          error={errorMessage || undefined}
        />
      );

    case 'number':
      return (
        <div className={`admin-form-group ${hasError ? 'admin-form-group-error' : ''}`}>
          <label>
            {label}
            {attribute.isRequired && <span className="admin-required">*</span>}
          </label>
          <input
            type="number"
            value={(value as number) ?? 0}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={attribute.placeholder}
            className={hasError ? 'admin-input-error' : ''}
          />
          {attribute.helpText && !hasError && (
            <span className="admin-help-text">{attribute.helpText}</span>
          )}
          {hasError && <span className="admin-error-text">{errorMessage}</span>}
        </div>
      );

    case 'boolean':
      return wrapWithError(
        <div className="admin-form-group admin-checkbox-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{label}</span>
          </label>
          {attribute.helpText && (
            <span className="admin-help-text">{attribute.helpText}</span>
          )}
        </div>
      );

    case 'image':
      return wrapWithError(
        <ImagePicker
          label={label}
          value={(value as { url: string; alt: string }) || { url: '', alt: '' }}
          onChange={onChange}
          helpText={attribute.helpText}
        />
      );

    case 'select':
      return (
        <FormSelect
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
          options={attribute.options || []}
          helpText={attribute.helpText}
          required={attribute.isRequired}
          error={errorMessage || undefined}
        />
      );

    case 'tags':
      return wrapWithError(
        <TagInput
          label={label}
          value={(value as string[]) || []}
          onChange={onChange}
          placeholder={attribute.placeholder}
          helpText={attribute.helpText}
        />
      );

    case 'array': {
      const arrayValue = (value as unknown[]) || [];
      const isSimple = isSimpleArray(attribute.children);
      
      // Get errors for array items
      const getItemErrors = (index: number) => 
        errors.filter((e) => e.field.startsWith(`${fieldPath}[${index}]`));

      if (isSimple && attribute.children?.[0]?.type === 'string') {
        // Simple string array - use TagInput
        return wrapWithError(
          <TagInput
            label={label}
            value={(arrayValue as string[]) || []}
            onChange={onChange}
            placeholder={attribute.placeholder}
            helpText={attribute.helpText}
          />
        );
      }

      // Complex array - use ArrayField with recursive rendering
      return wrapWithError(
        <ArrayField
          label={label}
          items={arrayValue}
          onChange={onChange}
          createItem={() => createDefaultArrayItem(attribute.children)}
          itemLabel={(item, index) => {
            // Try to find a title/name field in the item
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              const titleField = obj.title || obj.name || obj.label || obj.id;
              if (typeof titleField === 'string' && titleField) {
                return titleField;
              }
            }
            return `Item ${index + 1}`;
          }}
          renderItem={(item, index, onItemChange) => {
            const itemErrors = getItemErrors(index);
            
            if (isSimple) {
              // Simple array of primitives
              const child = attribute.children?.[0];
              if (child) {
                return (
                  <DynamicFieldRenderer
                    attribute={{ ...child, label: undefined, name: 'value' }}
                    value={item}
                    onChange={onItemChange}
                    path={`${fieldPath}[${index}]`}
                    errors={itemErrors}
                  />
                );
              }
              return null;
            }

            // Complex array of objects - render all children fields
            const itemObj = (item as Record<string, unknown>) || {};
            return (
              <div className="admin-array-item-fields">
                {[...(attribute.children || [])]
                  .sort((a, b) => a.order - b.order)
                  .map((child) => (
                    <DynamicFieldRenderer
                      key={child.id || child.name}
                      attribute={child}
                      value={itemObj[child.name]}
                      onChange={(newValue) =>
                        onItemChange({ ...itemObj, [child.name]: newValue })
                      }
                      path={`${fieldPath}[${index}]`}
                      errors={itemErrors}
                    />
                  ))}
              </div>
            );
          }}
        />
      );
    }

    case 'object': {
      const objectValue = (value as Record<string, unknown>) || {};
      const children = attribute.children || [];
      
      // Get errors for object children
      const childErrors = errors.filter((e) => e.field.startsWith(`${fieldPath}.`));

      if (children.length === 0) {
        // No children defined - show as JSON editor
        return (
          <FormTextarea
            label={label}
            value={JSON.stringify(objectValue, null, 2)}
            onChange={(v) => {
              try {
                onChange(JSON.parse(v));
              } catch {
                // Invalid JSON, don't update
              }
            }}
            helpText={attribute.helpText || 'Enter valid JSON'}
            rows={6}
            error={errorMessage || undefined}
          />
        );
      }

      return (
        <FieldGroup
          title={label}
          description={attribute.helpText}
          defaultExpanded={childErrors.length > 0} // Expand if there are errors inside
        >
          {[...children]
            .sort((a, b) => a.order - b.order)
            .map((child) => (
              <DynamicFieldRenderer
                key={child.id || child.name}
                attribute={child}
                value={objectValue[child.name]}
                onChange={(newValue) =>
                  onChange({ ...objectValue, [child.name]: newValue })
                }
                path={fieldPath}
                errors={childErrors}
              />
            ))}
        </FieldGroup>
      );
    }

    case 'reference':
      // TODO: Implement entity reference picker
      return (
        <FormInput
          label={`${label} (Reference to ${attribute.targetEntity})`}
          value={(value as string) || ''}
          onChange={onChange}
          placeholder={`ID of ${attribute.targetEntity} record`}
          helpText={attribute.helpText}
          error={errorMessage || undefined}
        />
      );

    default:
      return (
        <div className="admin-form-group">
          <label>{label}</label>
          <div className="admin-help-text">
            Unknown field type: {attribute.type}
          </div>
        </div>
      );
  }
};

export default DynamicFieldRenderer;
