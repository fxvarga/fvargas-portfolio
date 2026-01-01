import React from 'react';

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
    <div className="admin-form-group">
      <label>
        {label}
        {required && <span className="admin-required">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'admin-input-error' : ''}
      />
      {helpText && !error && (
        <span className="admin-help-text">{helpText}</span>
      )}
      {error && <span className="admin-error-text">{error}</span>}
    </div>
  );
};

export default FormInput;
