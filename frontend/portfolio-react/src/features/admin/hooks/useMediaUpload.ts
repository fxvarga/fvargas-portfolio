import { useState, useCallback } from 'react';
import { useConfig } from '../../../app/providers/ConfigProvider';
import { getAuthToken } from '../auth/AuthContext';
import { getSelectedPortfolioId } from '../auth/PortfolioContext';

export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  uploadedAt: string;
}

export interface MediaListResponse {
  items: MediaAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseMediaUploadReturn {
  /** Upload a file to the media library. Returns the created asset on success. */
  uploadMedia: (file: File, altText?: string) => Promise<MediaAsset>;
  /** List media assets with optional search and pagination. */
  listMedia: (search?: string, page?: number, pageSize?: number) => Promise<MediaListResponse>;
  /** Delete a media asset by ID. */
  deleteMedia: (id: string) => Promise<void>;
  /** Whether an upload is currently in progress. */
  isUploading: boolean;
  /** Upload progress (0-100) or null if not uploading. */
  uploadProgress: number | null;
  /** Error message from the last operation, if any. */
  error: string | null;
}

/** Derive REST base URL from the GraphQL endpoint in config. */
function getRestBaseUrl(apiUrl: string): string {
  return apiUrl.replace(/\/graphql\/?$/, '');
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const portfolioId = getSelectedPortfolioId();
  if (portfolioId) {
    headers['X-Portfolio-ID'] = portfolioId;
  }
  return headers;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const { config } = useConfig();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restBaseUrl = getRestBaseUrl(config.apiUrl);

  const uploadMedia = useCallback(
    async (file: File, altText?: string): Promise<MediaAsset> => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (altText) {
          formData.append('altText', altText);
        }

        // Use XMLHttpRequest for upload progress tracking
        const asset = await new Promise<MediaAsset>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${restBaseUrl}/api/media`);

          // Set auth headers
          const headers = buildHeaders();
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const errBody = JSON.parse(xhr.responseText);
                reject(new Error(errBody.error || `Upload failed: ${xhr.status}`));
              } catch {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(formData);
        });

        setUploadProgress(100);
        return asset;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
        // Clear progress after a short delay so the UI can show 100%
        setTimeout(() => setUploadProgress(null), 500);
      }
    },
    [restBaseUrl]
  );

  const listMedia = useCallback(
    async (search?: string, page?: number, pageSize?: number): Promise<MediaListResponse> => {
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (page) params.set('page', String(page));
        if (pageSize) params.set('pageSize', String(pageSize));

        const queryString = params.toString();
        const url = `${restBaseUrl}/api/media${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
          headers: buildHeaders(),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          throw new Error(errBody?.error || `Failed to list media: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to list media';
        setError(msg);
        throw err;
      }
    },
    [restBaseUrl]
  );

  const deleteMedia = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const response = await fetch(`${restBaseUrl}/api/media/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          throw new Error(errBody?.error || `Failed to delete media: ${response.status}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete media';
        setError(msg);
        throw err;
      }
    },
    [restBaseUrl]
  );

  return {
    uploadMedia,
    listMedia,
    deleteMedia,
    isUploading,
    uploadProgress,
    error,
  };
}
