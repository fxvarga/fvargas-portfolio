import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
} from '../api/mockData';

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
}

const CMSContext = createContext<CMSContextValue | undefined>(undefined);

interface CMSProviderProps {
  children: ReactNode;
}

export const CMSProvider: React.FC<CMSProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<CMSData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const cmsData = await fetchCMSData();
        setData(cmsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load CMS data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
};

export const useCMS = (): CMSContextValue => {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
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
