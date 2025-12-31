import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Hero from './Hero';

// Mock data
const mockHero = {
  title: 'Hello, I am',
  name: 'John Developer',
  backgroundText: 'Developer',
  image: {
    url: '/images/hero.png',
    alt: 'Hero portrait',
  },
  ctaButton: {
    label: 'Get In Touch',
    scrollTo: 'contact',
  },
  insightsDialog: {
    title: 'AI Image Generation',
    description: 'This feature uses AI to generate new images.',
    prompt: 'Generate a creative portrait',
  },
};

const mockSiteConfig = {
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'GitHub', url: 'https://github.com' },
  ],
};

let devModeEnabled = false;

vi.mock('../../../app/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: devModeEnabled,
    toggleDevMode: vi.fn(),
  }),
}));

vi.mock('../../../shared/hooks/useCMS', () => ({
  useHero: () => ({
    hero: mockHero,
    isLoading: false,
  }),
  useSiteConfig: () => ({
    siteConfig: mockSiteConfig,
  }),
}));

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    useLazyQuery: () => [vi.fn(), { loading: false, error: null }],
  };
});

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devModeEnabled = false;
  });

  it('renders the hero title and name', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    expect(screen.getByText('Hello, I am')).toBeDefined();
    expect(screen.getByText('John Developer')).toBeDefined();
  });

  it('renders the CTA button with correct label', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    expect(screen.getByText('Get In Touch')).toBeDefined();
  });

  it('renders the hero image with correct alt text', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    const image = screen.getByAltText('Hero portrait');
    expect(image).toBeDefined();
    expect(image.getAttribute('src')).toBe('/images/hero.png');
  });

  it('renders the background text', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    expect(screen.getByText('Developer')).toBeDefined();
  });

  it('renders social links from site config', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    expect(screen.getByText('LinkedIn')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('does not show insights dialog button when devMode is disabled', () => {
    devModeEnabled = false;
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );

    // The assistant-button class should not be present when devMode is off
    expect(screen.queryByText('AI Image Generation')).toBeNull();
  });
});
