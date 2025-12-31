import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import About from './About';

// Mock data
const mockAbout = {
  greeting: 'Welcome!',
  headline: 'About Me',
  subheadline: 'Full Stack Developer',
  bio: 'I am a passionate developer with 10 years of experience.',
  experienceYears: '10+',
  sectionTitle: 'About',
  image: {
    url: '/images/about.png',
    alt: 'About photo',
  },
  insightsDialog: {
    title: 'Real-time Subscriptions',
    description: 'This demonstrates GraphQL subscriptions.',
  },
};

let devModeEnabled = false;

vi.mock('../../../app/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: devModeEnabled,
    toggleDevMode: vi.fn(),
  }),
}));

vi.mock('../../../shared/hooks/useCMS', () => ({
  useAbout: () => ({
    about: mockAbout,
    isLoading: false,
  }),
}));

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    useLazyQuery: () => [vi.fn(), { loading: false, error: null, data: null }],
    useSubscription: () => ({ data: null, error: null, loading: false }),
  };
});

describe('About', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devModeEnabled = false;
  });

  it('renders the greeting text', () => {
    render(<About />);
    expect(screen.getByText('Welcome!')).toBeDefined();
  });

  it('renders the headline', () => {
    render(<About />);
    expect(screen.getByText('About Me')).toBeDefined();
  });

  it('renders the subheadline', () => {
    render(<About />);
    expect(screen.getByText('Full Stack Developer')).toBeDefined();
  });

  it('renders the bio text', () => {
    render(<About />);
    expect(screen.getByText('I am a passionate developer with 10 years of experience.')).toBeDefined();
  });

  it('renders the experience years', () => {
    render(<About />);
    expect(screen.getByText('10+')).toBeDefined();
  });

  it('renders the section title', () => {
    render(<About />);
    expect(screen.getByText('About')).toBeDefined();
  });

  it('renders the about image with correct alt text', () => {
    render(<About />);
    const image = screen.getByAltText('About photo');
    expect(image).toBeDefined();
    expect(image.getAttribute('src')).toBe('/images/about.png');
  });

  it('does not show insights dialog when devMode is disabled', () => {
    devModeEnabled = false;
    render(<About />);
    expect(screen.queryByText('Real-time Subscriptions')).toBeNull();
  });
});
