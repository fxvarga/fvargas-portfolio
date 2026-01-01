import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helpText?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  helpText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      <div className="admin-tag-input">
        <div className="admin-tag-input-tags">
          {value.map((tag, index) => (
            <span key={index} className="admin-tag">
              {tag}
              <button
                type="button"
                className="admin-tag-remove"
                onClick={() => handleRemove(index)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="admin-tag-input-field"
          />
        </div>
      </div>
      {helpText && <span className="admin-help-text">{helpText}</span>}
    </div>
  );
};

export default TagInput;
