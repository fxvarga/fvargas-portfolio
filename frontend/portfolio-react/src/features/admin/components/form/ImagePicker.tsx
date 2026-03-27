import React, { useState } from 'react';
import { Field, Input, makeStyles, tokens } from '@fluentui/react-components';

interface ImagePickerProps {
  label: string;
  value: { url: string; alt: string };
  onChange: (value: { url: string; alt: string }) => void;
  helpText?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  content: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  preview: {
    width: '80px',
    height: '80px',
    borderRadius: tokens.borderRadiusMedium,
    objectFit: 'cover' as const,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  fields: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  value,
  onChange,
  helpText,
}) => {
  const styles = useStyles();
  const [showPreview, setShowPreview] = useState(true);

  const handleUrlChange = (url: string) => {
    onChange({ ...value, url });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...value, alt });
  };

  return (
    <div className={styles.root}>
      <Field label={label} hint={helpText}>
        <div className={styles.content}>
          {showPreview && value.url && (
            <img
              src={value.url}
              alt={value.alt || 'Preview'}
              className={styles.preview}
              onError={() => setShowPreview(false)}
              onLoad={() => setShowPreview(true)}
            />
          )}
          <div className={styles.fields}>
            <Field label="Image URL">
              <Input
                value={value.url || ''}
                onChange={(_e, data) => handleUrlChange(data.value)}
                placeholder="/assets/images/..."
              />
            </Field>
            <Field label="Alt Text">
              <Input
                value={value.alt || ''}
                onChange={(_e, data) => handleAltChange(data.value)}
                placeholder="Describe the image..."
              />
            </Field>
          </div>
        </div>
      </Field>
    </div>
  );
};

export default ImagePicker;
