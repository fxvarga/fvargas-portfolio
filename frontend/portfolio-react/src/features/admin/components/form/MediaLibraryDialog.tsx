import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useMediaUpload, type MediaAsset } from '../../hooks/useMediaUpload';

interface MediaLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
}

const useStyles = makeStyles({
  surface: {
    maxWidth: '720px',
    width: '90vw',
    maxHeight: '80vh',
  },
  searchRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  searchInput: {
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: tokens.spacingHorizontalM,
    overflowY: 'auto',
    maxHeight: '400px',
    padding: tokens.spacingVerticalXS,
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    overflow: 'hidden',
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '0.15s',
  },
  cardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4,
    outline: `2px solid ${tokens.colorBrandStroke1}`,
    outlineOffset: '-2px',
  },
  cardImage: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    display: 'block',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  cardInfo: {
    padding: '6px 8px',
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  empty: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalS,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
});

const MediaLibraryDialog: React.FC<MediaLibraryDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const styles = useStyles();
  const { listMedia, error: hookError } = useMediaUpload();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchAssets = useCallback(
    async (searchTerm?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listMedia(searchTerm, 1, 50);
        setAssets(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load media');
      } finally {
        setLoading(false);
      }
    },
    [listMedia]
  );

  // Fetch on open
  useEffect(() => {
    if (open) {
      setSelectedAsset(null);
      setSearch('');
      fetchAssets();
    }
  }, [open, fetchAssets]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAssets(search || undefined);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchAssets]);

  const handleSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const displayError = error || hookError;

  return (
    <Dialog open={open} onOpenChange={(_e, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogTitle>Media Library</DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.searchRow}>
              <Input
                className={styles.searchInput}
                placeholder="Search images..."
                value={search}
                onChange={(_e, data) => setSearch(data.value)}
              />
            </div>

            {displayError && <div className={styles.error}>{displayError}</div>}

            {loading ? (
              <div className={styles.loading}>
                <Spinner size="medium" label="Loading media..." />
              </div>
            ) : assets.length === 0 ? (
              <div className={styles.empty}>
                <p>No images found.</p>
                <p>Upload images using the upload button in the image picker.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`${styles.card} ${selectedAsset?.id === asset.id ? styles.cardSelected : ''}`}
                    onClick={() => setSelectedAsset(asset)}
                    onDoubleClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                  >
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.fileName}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                    <div className={styles.cardInfo}>
                      {asset.altText || asset.fileName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            disabled={!selectedAsset}
            onClick={handleSelect}
          >
            Select
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default MediaLibraryDialog;
