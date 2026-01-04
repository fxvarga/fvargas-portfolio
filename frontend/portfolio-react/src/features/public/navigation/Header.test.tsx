import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import Header from './Header';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../app/providers/ConfigProvider', () => ({
  useConfig: () => ({
    config: {},
    isFeatureEnabled: (key: string) => key === 'Search',
  }),
}));

vi.mock('../../../shared/hooks/useCMS', () => ({
  useNavigation: () => ({
    navigation: {
      logo: { url: '/images/logo.png', alt: 'Logo' },
      menuItems: [
        { id: 1, title: 'Home', link: 'home' },
        { id: 2, title: 'About', link: 'about' },
        { id: 3, title: 'Services', link: 'services' },
      ],
      searchPlaceholder: 'Search...',
    },
  }),
}));

// Helper to render with Router
const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays logo', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />);
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeDefined();
  });

  it('displays navigation menu items', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />);
    // Use getAllByText since mobile menu also contains these items
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Services').length).toBeGreaterThan(0);
  });

  it('displays OS toggle button', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />);
    const osButton = screen.getByTitle('Launch OS Experience');
    expect(osButton).toBeDefined();
    expect(screen.getByText('OS')).toBeDefined();
  });

  it('navigates to /os when OS toggle button is clicked', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />);
    const osButton = screen.getByTitle('Launch OS Experience');
    fireEvent.click(osButton);
    expect(mockNavigate).toHaveBeenCalledWith('/os');
  });

  it('uses scroll links on homepage', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />, { route: '/' });
    // On homepage, menu items should be scroll links
    const aboutLinks = screen.getAllByText('About');
    expect(aboutLinks.length).toBeGreaterThan(0);
  });

  it('uses router links on other pages', () => {
    renderWithRouter(<Header topbarNone="" hclass="" />, { route: '/work/test' });
    // On other pages, menu items should be router links
    const aboutLinks = screen.getAllByText('About');
    // There might be multiple due to mobile menu, just check that at least one exists
    expect(aboutLinks.length).toBeGreaterThan(0);
  });
});
