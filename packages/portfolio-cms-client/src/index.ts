// ============================================================
// @fvargas/portfolio-cms-client — Public API
// ============================================================

// Types
export type { AppConfig, FeatureFlags, EntityRecord } from './types';

// ConfigProvider
export { ConfigProvider, useConfig } from './ConfigProvider';

// CmsProvider + hooks
export {
  CmsProvider,
  useRealCms,
  useEntity,
  useCollection,
  CmsPreviewContext,
} from './CmsProvider';
export type { CmsPreviewOverrides } from './CmsProvider';

// PreviewProvider
export { PreviewProvider } from './PreviewProvider';

// CmsAgentWrapper
export { CmsAgentWrapper } from './CmsAgentWrapper';
export type { CmsAgentWrapperProps } from './CmsAgentWrapper';
