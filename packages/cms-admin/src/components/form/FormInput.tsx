import React from 'react';
import { Field, Input } from '@fluentui/react-components';
import type { InputProps } from '@fluentui/react-components';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'tel';
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  helpText,
  error,
  disabled = false,
}) => {
  return (
    <Field
      label={label}
      required={required}
      hint={!error ? helpText : undefined}
      validationMessage={error}
      validationState={error ? 'error' : undefined}
    >
      <Input
        type={type as InputProps['type']}
        value={value}
        onChange={(_e, data) => onChange(data.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </Field>
  );
};

export default FormInput;
