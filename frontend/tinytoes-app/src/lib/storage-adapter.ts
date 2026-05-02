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
    nativeIAP?: {
      purchase(): Promise<{ transactionId: string; purchased: boolean }>;
      restore(): Promise<{ transactionId: string; purchased: boolean }>;
      getStatus(): Promise<{ transactionId: string; purchased: boolean; price: string }>;
    };
  }
}

/** Returns true when running inside the native iOS wrapper. */
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && window.__TINYTOES_NATIVE === true;
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
