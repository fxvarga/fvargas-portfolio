import React from 'react';
import { Field, Dropdown, Option } from '@fluentui/react-components';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  helpText,
  error,
  disabled = false,
}) => {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Field
      label={label}
      required={required}
      hint={!error ? helpText : undefined}
      validationMessage={error}
      validationState={error ? 'error' : undefined}
    >
      <Dropdown
        value={selectedOption?.label ?? ''}
        selectedOptions={value ? [value] : []}
        onOptionSelect={(_e, data) => onChange(data.optionValue ?? '')}
        placeholder={placeholder}
        disabled={disabled}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Dropdown>
    </Field>
  );
};

export default FormSelect;
