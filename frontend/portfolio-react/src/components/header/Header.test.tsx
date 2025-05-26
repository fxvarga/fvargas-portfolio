import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header';
let devMode = true
let toggleDevModeFn = vi.fn()
vi.mock('../../main-component/State/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: devMode,
    toggleDevMode: toggleDevModeFn
  }),
}));

vi.mock('../../main-component/State/ConfigProvider', () => ({
  useConfig: () => ({
    config: {},
    isFeatureEnabled: (key: string) => key === 'DevMode',
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
    const switchControl = screen.getByLabelText(/InsightsSwitch/i);
    fireEvent.click(switchControl);
    expect(toggleDevModeFn).toHaveBeenCalledTimes(1)
  })
});
