import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  CMSData,
  SiteConfig,
  HeroSection,
  AboutSection,
  ServicesSection,
  ContactSection,
  Navigation,
  Footer,
  Service,
  fetchCMSData,
} from '../../api/cmsApi';

interface CMSContextValue {
  isLoading: boolean;
  error: Error | null;
  siteConfig: SiteConfig | null;
  hero: HeroSection | null;
  about: AboutSection | null;
  services: ServicesSection | null;
  contact: ContactSection | null;
  navigation: Navigation | null;
  footer: Footer | null;
  getServiceById: (id: string) => Service | undefined;
  /** Re-fetch all CMS data from the backend. Used after agent commits. */
  refetch: () => Promise<void>;
}

const CMSContext = createContext<CMSContextValue | undefined>(undefined);

/**
 * Preview context: when set, useCMS() returns this data instead of the real data.
 * This is populated by PreviewProvider when the agent has proposed changes and
 * isPreviewActive is true. The context is undefined when no preview is active.
 */
export const CMSPreviewContext = createContext<CMSContextValue | undefined>(undefined);

/**
 * Blog preview context: maps recordId → partial field overrides for blog posts.
 * Populated by PreviewProvider when agent proposes changes to blog-post entities.
 * Consumed by BlogPost.tsx via the useBlogPostPreview hook.
 */
export interface BlogPostPreviewOverrides {
  [recordId: string]: Record<string, unknown>;
}
export const BlogPreviewContext = createContext<BlogPostPreviewOverrides | undefined>(undefined);

interface CMSProviderProps {
  children: ReactNode;
}

export const CMSProvider: React.FC<CMSProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<CMSData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cmsData = await fetchCMSData();
      setData(cmsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load CMS data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getServiceById = (id: string): Service | undefined => {
    return data?.services.services.find((s) => s.id === id);
  };

  const value: CMSContextValue = {
    isLoading,
    error,
    siteConfig: data?.siteConfig ?? null,
    hero: data?.hero ?? null,
    about: data?.about ?? null,
    services: data?.services ?? null,
    contact: data?.contact ?? null,
    navigation: data?.navigation ?? null,
    footer: data?.footer ?? null,
    getServiceById,
    refetch: loadData,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
};

/**
 * Main CMS hook. When a CMSPreviewContext is provided (i.e. the agent
 * has proposed changes and preview is active), it returns the preview
 * data. Otherwise it returns the real CMS data.
 *
 * This means ALL existing section hooks (useHero, useAbout, etc.)
 * automatically render preview data without any changes.
 */
export const useCMS = (): CMSContextValue => {
  const previewContext = useContext(CMSPreviewContext);
  const realContext = useContext(CMSContext);

  // Preview takes priority when available
  if (previewContext) {
    return previewContext;
  }

  if (realContext === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return realContext;
};

/**
 * Hook to access the real (non-preview) CMS data.
 * Used by PreviewProvider to get the base data to merge changes onto.
 */
export const useRealCMS = (): CMSContextValue => {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useRealCMS must be used within a CMSProvider');
  }
  return context;
};

// Convenience hooks for specific sections
export const useHero = () => {
  const { hero, isLoading, error } = useCMS();
  return { hero, isLoading, error };
};

export const useAbout = () => {
  const { about, isLoading, error } = useCMS();
  return { about, isLoading, error };
};

export const useServices = () => {
  const { services, isLoading, error } = useCMS();
  return { services, isLoading, error };
};

export const useContact = () => {
  const { contact, siteConfig, isLoading, error } = useCMS();
  return { contact, contactInfo: siteConfig?.contact, isLoading, error };
};

export const useNavigation = () => {
  const { navigation, isLoading, error } = useCMS();
  return { navigation, isLoading, error };
};

export const useFooter = () => {
  const { footer, siteConfig, isLoading, error } = useCMS();
  return { footer, siteConfig, isLoading, error };
};

export const useSiteConfig = () => {
  const { siteConfig, isLoading, error } = useCMS();
  return { siteConfig, isLoading, error };
};

/**
 * Hook for blog post preview. Accepts the real blog post and returns
 * a version with preview overrides merged in (if any exist).
 * If no preview is active for this post, returns the original.
 */
export const useBlogPostPreview = <T extends { id: string }>(post: T | null): T | null => {
  const overrides = useContext(BlogPreviewContext);
  if (!post || !overrides) return post;

  const changes = overrides[post.id];
  if (!changes) return post;

  // Shallow-merge the overrides onto the post
  return { ...post, ...changes };
};
