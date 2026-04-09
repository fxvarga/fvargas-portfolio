import type { ReactNode } from 'react';
import type { ProductSlug } from '@/types';

interface FeatureGateProps {
  /** The product slug required to access this feature */
  requires: ProductSlug;
  /** The list of product slugs the current user owns */
  entitlements: string[];
  /** Content to show when the user has the entitlement */
  children: ReactNode;
  /** Optional content to show when the user lacks the entitlement */
  fallback?: ReactNode;
}

export function FeatureGate({ requires, entitlements, children, fallback }: FeatureGateProps) {
  if (entitlements.includes(requires)) {
    return <>{children}</>;
  }
  return fallback ? <>{fallback}</> : null;
}
