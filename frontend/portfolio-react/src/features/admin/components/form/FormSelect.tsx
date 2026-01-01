import React from 'react';

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
  return (
    <div className="admin-form-group">
      <label>
        {label}
        {required && <span className="admin-required">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={error ? 'admin-input-error' : ''}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <span className="admin-help-text">{helpText}</span>
      )}
      {error && <span className="admin-error-text">{error}</span>}
    </div>
  );
};

export default FormSelect;
