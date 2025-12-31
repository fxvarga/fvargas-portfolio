import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import {
  CMSProvider,
  useCMS,
  useHero,
  useAbout,
  useServices,
  useContact,
  useNavigation,
  useFooter,
  useSiteConfig,
} from './useCMS';

// Mock CMS data
const mockCMSData = {
  siteConfig: {
    owner: {
      name: 'Test Portfolio',
      title: 'Test Title',
      tagline: 'Test Tagline',
    },
    contact: {
      email: 'test@example.com',
      phone: '555-1234',
      formEndpoint: 'https://test.com',
    },
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com', icon: 'ti-linkedin' },
    ],
    copyright: '2024',
  },
  hero: {
    title: 'Hello',
    name: 'John Doe',
    backgroundText: 'Developer',
    image: { url: '/hero.png', alt: 'Hero' },
    ctaButton: { label: 'Contact', scrollTo: 'contact' },
    insightsDialog: { title: 'AI', description: 'desc', prompt: 'prompt' },
  },
  about: {
    greeting: 'Hi',
    headline: 'About Me',
    subheadline: 'Developer',
    bio: 'Bio text',
    experienceYears: '10+',
    sectionTitle: 'About',
    image: { url: '/about.png', alt: 'About' },
    insightsDialog: { title: 'Subscriptions', description: 'desc' },
  },
  services: {
    label: 'Enterprise',
    title: 'Services',
    backgroundText: 'Services',
    services: [
      { 
        id: 'service1', 
        title: 'Web Dev', 
        icon: 'code', 
        description: 'Desc',
        image: { url: '/web.png', alt: 'Web Dev' },
        dialogTitle: 'Web Development',
        leadIn: 'Lead in text',
        technologies: ['React', 'Node.js'],
        approach: [{ title: 'Approach 1', content: 'Content 1' }],
        cta: { title: 'CTA', description: 'CTA desc' },
      },
      { 
        id: 'service2', 
        title: 'Mobile Dev', 
        icon: 'mobile', 
        description: 'Desc',
        image: { url: '/mobile.png', alt: 'Mobile Dev' },
        dialogTitle: 'Mobile Development',
        leadIn: 'Lead in text',
        technologies: ['React Native'],
        approach: [{ title: 'Approach 1', content: 'Content 1' }],
        cta: { title: 'CTA', description: 'CTA desc' },
      },
    ],
  },
  contact: {
    title: 'Contact',
    description: 'Get in touch',
    backgroundText: 'Contact',
    successMessage: 'Message sent!',
    errorMessage: 'Error sending message',
    submitButtonText: 'Submit',
    formFields: {
      name: { label: 'Name', placeholder: 'Your Name' },
      email: { label: 'Email', placeholder: 'Your Email' },
      message: { label: 'Message', placeholder: 'Your Message' },
    },
  },
  navigation: {
    logo: { url: '/logo.png', alt: 'Logo' },
    menuItems: [{ id: 'home', title: 'Home', link: 'home' }],
    insightsLabel: 'Insights',
    devModeLabel: 'DEV MODE',
  },
  footer: {
    logo: { url: '/logo.png', alt: 'Logo' },
  },
};

vi.mock('../../api/cmsApi', () => ({
  fetchCMSData: () => Promise.resolve(mockCMSData),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CMSProvider>{children}</CMSProvider>
);

describe('CMSProvider and useCMS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides CMS data after loading', async () => {
    const { result } = renderHook(() => useCMS(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.siteConfig?.owner?.name).toBe('Test Portfolio');
    expect(result.current.hero?.title).toBe('Hello');
    expect(result.current.about?.headline).toBe('About Me');
    expect(result.current.services?.services).toHaveLength(2);
  });

  it('throws error when used outside CMSProvider', () => {
    expect(() => {
      renderHook(() => useCMS());
    }).toThrow('useCMS must be used within a CMSProvider');
  });

  it('getServiceById returns the correct service', async () => {
    const { result } = renderHook(() => useCMS(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const service = result.current.getServiceById('service1');
    expect(service?.title).toBe('Web Dev');
  });

  it('getServiceById returns undefined for non-existent service', async () => {
    const { result } = renderHook(() => useCMS(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const service = result.current.getServiceById('nonexistent');
    expect(service).toBeUndefined();
  });
});

describe('useHero', () => {
  it('returns hero section data', async () => {
    const { result } = renderHook(() => useHero(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hero?.title).toBe('Hello');
    expect(result.current.hero?.name).toBe('John Doe');
  });
});

describe('useAbout', () => {
  it('returns about section data', async () => {
    const { result } = renderHook(() => useAbout(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.about?.headline).toBe('About Me');
    expect(result.current.about?.bio).toBe('Bio text');
  });
});

describe('useServices', () => {
  it('returns services section data', async () => {
    const { result } = renderHook(() => useServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.services?.services).toHaveLength(2);
    expect(result.current.services?.title).toBe('Services');
  });
});

describe('useContact', () => {
  it('returns contact section and contact info from siteConfig', async () => {
    const { result } = renderHook(() => useContact(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contact?.title).toBe('Contact');
    expect(result.current.contactInfo?.email).toBe('test@example.com');
  });
});

describe('useNavigation', () => {
  it('returns navigation data', async () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.navigation?.menuItems).toHaveLength(1);
    expect(result.current.navigation?.logo.alt).toBe('Logo');
  });
});

describe('useFooter', () => {
  it('returns footer and siteConfig data', async () => {
    const { result } = renderHook(() => useFooter(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.footer?.logo?.alt).toBe('Logo');
    expect(result.current.siteConfig?.owner?.name).toBe('Test Portfolio');
  });
});

describe('useSiteConfig', () => {
  it('returns site config data', async () => {
    const { result } = renderHook(() => useSiteConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.siteConfig?.owner?.name).toBe('Test Portfolio');
    expect(result.current.siteConfig?.socialLinks).toHaveLength(1);
  });
});
