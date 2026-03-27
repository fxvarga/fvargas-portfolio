import React from 'react';
import {
  Checkbox,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
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
  path?: string;
  errors?: ValidationError[];
}

const useStyles = makeStyles({
  arrayItemFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  attribute,
  value,
  onChange,
  path = '',
  errors = [],
}) => {
  const styles = useStyles();
  const label = getAttributeLabel(attribute);
  const fieldPath = path ? `${path}.${attribute.name}` : attribute.name;

  // Get direct errors for this field (exact match)
  const directErrors = errors.filter((e) => e.field === fieldPath);
  const hasError = directErrors.length > 0;
  const errorMessage = directErrors.map((e) => e.message).join('; ');

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
        <Field
          label={label}
          required={attribute.isRequired}
          hint={!hasError ? attribute.helpText : undefined}
          validationMessage={errorMessage || undefined}
          validationState={hasError ? 'error' : undefined}
        >
          <Input
            type="number"
            value={String((value as number) ?? 0)}
            onChange={(_e, data) => onChange(parseFloat(data.value) || 0)}
            placeholder={attribute.placeholder}
          />
        </Field>
      );

    case 'boolean':
      return (
        <Field hint={attribute.helpText}>
          <Checkbox
            checked={Boolean(value)}
            onChange={(_e, data) => onChange(data.checked)}
            label={label}
          />
        </Field>
      );

    case 'image': {
      let imageValue: { url: string; alt: string };
      if (!value) {
        imageValue = { url: '', alt: '' };
      } else if (typeof value === 'string') {
        imageValue = { url: value, alt: '' };
      } else {
        imageValue = value as { url: string; alt: string };
      }
      return (
        <ImagePicker
          label={label}
          value={imageValue}
          onChange={onChange}
          helpText={attribute.helpText}
        />
      );
    }

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
      return (
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

      const getItemErrors = (index: number) =>
        errors.filter((e) => e.field.startsWith(`${fieldPath}[${index}]`));

      if (isSimple && attribute.children?.[0]?.type === 'string') {
        return (
          <TagInput
            label={label}
            value={(arrayValue as string[]) || []}
            onChange={onChange}
            placeholder={attribute.placeholder}
            helpText={attribute.helpText}
          />
        );
      }

      return (
        <ArrayField
          label={label}
          items={arrayValue}
          onChange={onChange}
          createItem={() => createDefaultArrayItem(attribute.children)}
          itemLabel={(item, index) => {
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

            const itemObj = (item as Record<string, unknown>) || {};
            return (
              <div className={styles.arrayItemFields}>
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

      const childErrors = errors.filter((e) => e.field.startsWith(`${fieldPath}.`));

      if (children.length === 0) {
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
          defaultExpanded={childErrors.length > 0}
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
        <Field label={label}>
          <Text size={200}>Unknown field type: {attribute.type}</Text>
        </Field>
      );
  }
};

export default DynamicFieldRenderer;
