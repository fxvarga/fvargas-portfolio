import React, { useState, useRef, useCallback } from 'react';
import {
  Field,
  Input,
  Button,
  ProgressBar,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import MediaLibraryDialog from './MediaLibraryDialog';
import type { MediaAsset } from '../../hooks/useMediaUpload';

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
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap' as const,
  },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '0.15s',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  dropZoneActive: {
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  progress: {
    marginTop: tokens.spacingVerticalXS,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXS,
  },
  hiddenInput: {
    display: 'none',
  },
});

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';

const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  value,
  onChange,
  helpText,
}) => {
  const styles = useStyles();
  const [showPreview, setShowPreview] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadMedia, isUploading, uploadProgress, error: uploadError } = useMediaUpload();

  const handleUrlChange = (url: string) => {
    onChange({ ...value, url });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...value, alt });
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const asset = await uploadMedia(file, value.alt || undefined);
        onChange({ url: asset.url, alt: asset.altText || value.alt || '' });
        setShowPreview(true);
      } catch {
        // Error is tracked by the hook
      }
    },
    [uploadMedia, onChange, value.alt]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleLibrarySelect = useCallback(
    (asset: MediaAsset) => {
      onChange({ url: asset.url, alt: asset.altText || value.alt || '' });
      setShowPreview(true);
    },
    [onChange, value.alt]
  );

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
                placeholder="/uploads/... or https://..."
              />
            </Field>
            <Field label="Alt Text">
              <Input
                value={value.alt || ''}
                onChange={(_e, data) => handleAltChange(data.value)}
                placeholder="Describe the image..."
              />
            </Field>

            {/* Upload actions */}
            <div className={styles.actions}>
              <Button
                size="small"
                appearance="primary"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Image
              </Button>
              <Button
                size="small"
                appearance="secondary"
                disabled={isUploading}
                onClick={() => setShowLibrary(true)}
              >
                Media Library
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className={styles.hiddenInput}
                onChange={handleFileSelect}
              />
            </div>

            {/* Drop zone */}
            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragOver
                ? 'Drop image here'
                : 'Drag & drop an image, or click to browse'}
            </div>

            {/* Upload progress */}
            {isUploading && uploadProgress !== null && (
              <ProgressBar
                className={styles.progress}
                value={uploadProgress / 100}
                max={1}
              />
            )}

            {/* Upload error */}
            {uploadError && (
              <div className={styles.error}>{uploadError}</div>
            )}
          </div>
        </div>
      </Field>

      {/* Media Library Dialog */}
      <MediaLibraryDialog
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
};

export default ImagePicker;
