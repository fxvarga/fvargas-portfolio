import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header';

let devMode = true
let toggleDevModeFn = vi.fn()

vi.mock('../../../app/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: devMode,
    toggleDevMode: toggleDevModeFn
  }),
}));

vi.mock('../../../app/providers/ConfigProvider', () => ({
  useConfig: () => ({
    config: {},
    isFeatureEnabled: (key: string) => key === 'DevMode',
  }),
}));

vi.mock('../../../shared/hooks/useCMS', () => ({
  useNavigation: () => ({
    navigation: {
      logo: { url: '/images/logo.png', alt: 'Logo' },
      menuItems: [
        { id: 'home', title: 'Home', link: 'home' },
        { id: 'about', title: 'About', link: 'about' },
      ],
      insightsLabel: 'Insights',
      devModeLabel: 'INSIGHTS MODE ON',
    },
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays "INSIGHTS MODE ON" badge when devMode is enabled and feature is enabled', () => {
    render(<Header topbarNone="" hclass="" />);

    expect(screen.getByText(/INSIGHTS MODE ON/i)).toBeDefined();
  });
  it('does not display "INSIGHTS MODE ON" badge when devMode is disabled',() =>{
    devMode = false
    render(<Header topbarNone="" hclass="" />);
    expect(screen.queryByText(/INSIGHTS MODE ON/i)).toBeNull();
  });

  it('calls toggleDevMode when the switch is clicked', ()=>{
    render(<Header topbarNone="" hclass="" />);
    const switches = screen.getAllByLabelText(/Insights/i);
    fireEvent.click(switches[0]);
    expect(toggleDevModeFn).toHaveBeenCalledTimes(1)
  })
});
