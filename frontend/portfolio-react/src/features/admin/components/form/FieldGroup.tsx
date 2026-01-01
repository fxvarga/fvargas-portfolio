import React, { useState } from 'react';

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  description?: string;
}

const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  children,
  defaultExpanded = true,
  description,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`admin-field-group ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        type="button"
        className="admin-field-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="admin-field-group-toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="admin-field-group-title">{title}</span>
        {description && (
          <span className="admin-field-group-description">{description}</span>
        )}
      </button>
      {isExpanded && (
        <div className="admin-field-group-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default FieldGroup;
