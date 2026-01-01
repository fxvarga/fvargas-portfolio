import React, { useState } from 'react';

interface ImagePickerProps {
  label: string;
  value: { url: string; alt: string };
  onChange: (value: { url: string; alt: string }) => void;
  helpText?: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  value,
  onChange,
  helpText,
}) => {
  const [showPreview, setShowPreview] = useState(true);

  const handleUrlChange = (url: string) => {
    onChange({ ...value, url });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...value, alt });
  };

  return (
    <div className="admin-image-picker">
      <label className="admin-image-picker-label">{label}</label>
      <div className="admin-image-picker-content">
        {showPreview && value.url && (
          <div className="admin-image-preview">
            <img
              src={value.url}
              alt={value.alt || 'Preview'}
              onError={() => setShowPreview(false)}
              onLoad={() => setShowPreview(true)}
            />
          </div>
        )}
        <div className="admin-image-fields">
          <div className="admin-form-group">
            <label>Image URL</label>
            <input
              type="text"
              value={value.url || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="/assets/images/..."
            />
          </div>
          <div className="admin-form-group">
            <label>Alt Text</label>
            <input
              type="text"
              value={value.alt || ''}
              onChange={(e) => handleAltChange(e.target.value)}
              placeholder="Describe the image..."
            />
          </div>
        </div>
      </div>
      {helpText && <span className="admin-help-text">{helpText}</span>}
    </div>
  );
};

export default ImagePicker;
