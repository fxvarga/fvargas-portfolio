import React from 'react';

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

  return (
    <div className="admin-form-group">
      <label>
        {label}
        {required && <span className="admin-required">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={error ? 'admin-input-error' : ''}
      />
      <div className="admin-textarea-footer">
        {helpText && !error && (
          <span className="admin-help-text">{helpText}</span>
        )}
        {error && <span className="admin-error-text">{error}</span>}
        {maxLength && (
          <span className="admin-char-count">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormTextarea;
