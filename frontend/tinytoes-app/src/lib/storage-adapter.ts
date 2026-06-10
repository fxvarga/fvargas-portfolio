/**
 * Storage adapter that routes operations to either IndexedDB (browser/PWA)
 * or native Swift bridge (iOS app wrapper).
 *
 * Detection: the iOS app injects `window.__TINYTOES_NATIVE = true` at document start.
 */

declare global {
  interface Window {
    __TINYTOES_NATIVE?: boolean;
    nativeStorage?: {
      get(store: string, key: string): Promise<unknown>;
      getAll(store: string): Promise<unknown[]>;
      put(store: string, key: string, value: unknown): Promise<boolean>;
      delete(store: string, key: string): Promise<boolean>;
      clear(store: string): Promise<boolean>;
    };
    nativeExport?: {
      shareFile(filename: string, base64Data: string, mimeType: string): Promise<boolean>;
    };
    nativeImages?: {
      save(dataUrl: string): Promise<string>;
      read(url: string): Promise<string>;
      delete(url: string): Promise<boolean>;
      clear(): Promise<boolean>;
    };
    nativeCloudSharing?: {
      createSharePackage(manifestJson: string, assets: CloudShareAssetInput[]): Promise<CloudShareResult>;
      importLatestSharedPackage(): Promise<CloudSharePackage | null>;
    };
    nativeIAP?: {
      purchase(): Promise<{ transactionId: string; purchased: boolean }>;
      restore(): Promise<{ transactionId: string; purchased: boolean }>;
      getStatus(): Promise<{
        transactionId: string;
        purchased: boolean;
        price: string;
        productAvailable?: boolean;
        error?: string;
      }>;
    };
  }
}

export interface CloudShareAssetInput {
  assetId: string;
  dataUrl: string;
  fileName: string;
  contentType: string;
}

export interface CloudShareResult {
  status: 'presented';
  recordName: string;
}

export interface CloudShareAssetPayload {
  assetId: string;
  dataUrl: string;
  contentType: string;
  fileName: string;
}

export interface CloudSharePackage {
  recordName: string;
  manifestJson: string;
  assets: CloudShareAssetPayload[];
}

/** Returns true when running inside the native iOS wrapper. */
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && window.__TINYTOES_NATIVE === true;
}

export function isNativeImageReference(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('app://localhost/__tinytoes_images/');
}

export async function resolveImageForExport(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (isNativeImageReference(value) && isNativeApp() && window.nativeImages) {
    return window.nativeImages.read(value);
  }
  return value;
}

export async function storeImageReference(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith('data:image/') && isNativeApp() && window.nativeImages) {
    return window.nativeImages.save(value);
  }
  return value;
}

export async function clearStoredImages(): Promise<void> {
  if (isNativeApp() && window.nativeImages) {
    await window.nativeImages.clear();
  }
}

export async function createNativeCloudSharePackage(
  manifestJson: string,
  assets: CloudShareAssetInput[],
): Promise<CloudShareResult> {
  if (!isNativeApp() || !window.nativeCloudSharing) {
    throw new Error('Cloud sharing is only available in the TinyToes iPhone app.');
  }
  return window.nativeCloudSharing.createSharePackage(manifestJson, assets);
}

export async function importLatestNativeCloudSharePackage(): Promise<CloudSharePackage | null> {
  if (!isNativeApp() || !window.nativeCloudSharing) {
    throw new Error('Cloud sharing is only available in the TinyToes iPhone app.');
  }
  return window.nativeCloudSharing.importLatestSharedPackage();
}

/**
 * Share/download a file. In the native wrapper, presents the iOS share sheet.
 * In a browser, falls back to the standard blob download approach.
 */
export async function shareOrDownloadFile(
  filename: string,
  data: string | Uint8Array | Blob,
  mimeType: string
): Promise<void> {
  if (isNativeApp() && window.nativeExport) {
    // Convert to base64 for the bridge
    let base64: string;
    if (typeof data === 'string') {
      base64 = btoa(unescape(encodeURIComponent(data)));
    } else if (data instanceof Blob) {
      const buffer = await data.arrayBuffer();
      base64 = arrayBufferToBase64(buffer);
    } else {
      base64 = arrayBufferToBase64(data.buffer);
    }
    await window.nativeExport.shareFile(filename, base64, mimeType);
  } else {
    // Browser fallback: blob URL download
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
