import React from 'react';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { EntityDefinition, ValidationError } from '../../types/entityDefinition';

interface DynamicEntityEditorProps {
  definition: EntityDefinition;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  validationErrors?: ValidationError[];
}

const DynamicEntityEditor: React.FC<DynamicEntityEditorProps> = ({
  definition,
  data,
  onChange,
  validationErrors = [],
}) => {
  const sortedAttributes = [...definition.attributes].sort(
    (a, b) => a.order - b.order
  );

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({ ...data, [fieldName]: value });
  };

  // Get errors for a specific field (including nested paths)
  const getFieldErrors = (fieldName: string): ValidationError[] => {
    return validationErrors.filter(
      (error) => error.field === fieldName || error.field.startsWith(`${fieldName}.`) || error.field.startsWith(`${fieldName}[`)
    );
  };

  return (
    <div className="admin-editor-form admin-dynamic-editor">
      {sortedAttributes.map((attr) => (
        <DynamicFieldRenderer
          key={attr.id || attr.name}
          attribute={attr}
          value={data[attr.name]}
          onChange={(value) => handleFieldChange(attr.name, value)}
          errors={getFieldErrors(attr.name)}
        />
      ))}
    </div>
  );
};

export default DynamicEntityEditor;
