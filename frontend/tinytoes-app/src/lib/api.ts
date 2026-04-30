import type { SessionInfo, Product, EntitlementsResponse, PrintProduct, CostEstimate, ShippingOption, PrintOrder } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || 'Something went wrong.');
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  claim: (email: string, code: string) =>
    request<{ email: string }>('/claim', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  getSession: () =>
    request<SessionInfo>('/session'),

  logout: () =>
    request<{ message: string }>('/logout', { method: 'POST' }),

  getProducts: () =>
    request<Product[]>('/products'),

  getEntitlements: () =>
    request<EntitlementsResponse>('/entitlements'),

  checkout: (productSlug: string) =>
    request<{ url: string }>('/checkout', {
      method: 'POST',
      body: JSON.stringify({ productSlug }),
    }),

  // --- Print API ---

  getPrintProducts: () =>
    request<PrintProduct[]>('/print/products'),

  getCostEstimate: (podPackageId: string, pageCount: number) =>
    request<CostEstimate>('/print/cost-estimate', {
      method: 'POST',
      body: JSON.stringify({ podPackageId, pageCount }),
    }),

  getShippingOptions: (podPackageId: string, pageCount: number, postalCode: string, stateCode: string, city?: string, street1?: string) =>
    request<ShippingOption[]>('/print/shipping-options', {
      method: 'POST',
      body: JSON.stringify({ podPackageId, pageCount, country: 'US', postalCode, stateCode, city: city || 'New York', street1: street1 || '1 Main St', phoneNumber: '5551234567' }),
    }),

  getCoverDimensions: (podPackageId: string, pageCount: number) =>
    request<{ widthPt: number; heightPt: number }>('/print/cover-dimensions', {
      method: 'POST',
      body: JSON.stringify({ podPackageId, pageCount }),
    }),

  uploadPdf: (file: Blob, type: 'interior' | 'cover') => {
    const formData = new FormData();
    formData.append('file', file, `${type}.pdf`);
    formData.append('type', type);
    return fetch(`${API_URL}/print/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.error || 'Upload failed.');
      }
      return res.json() as Promise<{ url: string; blobId: string }>;
    });
  },

  printCheckout: (data: {
    productSlug: string;
    interiorBlobId: string;
    coverBlobId: string;
    pageCount: number;
    email: string;
    shippingLevel: string;
    shippingAddress: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      stateCode: string;
      postalCode: string;
      countryCode: string;
    };
  }) =>
    request<{ url: string }>('/print/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrder: (token: string) =>
    request<PrintOrder>(`/print/orders/${token}`),

  resendOrderLink: (email: string) =>
    request<{ message: string }>('/print/orders/resend-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
