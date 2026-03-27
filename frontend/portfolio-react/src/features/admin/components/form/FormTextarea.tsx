import React from 'react';
import { Field, Textarea } from '@fluentui/react-components';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  required = false,
  helpText,
  error,
  disabled = false,
}) => {
  const charCount = value?.length || 0;

  const hintContent = maxLength
    ? `${helpText ? helpText + ' | ' : ''}${charCount}/${maxLength}`
    : helpText;

  return (
    <Field
      label={label}
      required={required}
      hint={!error ? hintContent : undefined}
      validationMessage={error}
      validationState={error ? 'error' : undefined}
    >
      <Textarea
        value={value}
        onChange={(_e, data) => onChange(data.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        resize="vertical"
      />
    </Field>
  );
};

export default FormTextarea;
