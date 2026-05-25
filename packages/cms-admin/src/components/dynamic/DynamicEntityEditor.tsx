import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { EntityDefinition, ValidationError } from '../../types/entityDefinition';

interface DynamicEntityEditorProps {
  definition: EntityDefinition;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  validationErrors?: ValidationError[];
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

const DynamicEntityEditor: React.FC<DynamicEntityEditorProps> = ({
  definition,
  data,
  onChange,
  validationErrors = [],
}) => {
  const styles = useStyles();
  const sortedAttributes = [...definition.attributes].sort(
    (a, b) => a.order - b.order
  );

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({ ...data, [fieldName]: value });
  };

  const getFieldErrors = (fieldName: string): ValidationError[] => {
    return validationErrors.filter(
      (error) => error.field === fieldName || error.field.startsWith(`${fieldName}.`) || error.field.startsWith(`${fieldName}[`)
    );
  };

  return (
    <div className={styles.root}>
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
