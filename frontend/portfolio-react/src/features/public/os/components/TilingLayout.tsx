import React from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

/**
 * Hyprland-style Master-Stack Tiling Layout
 * 
 * Layout behavior:
 * - 1 window: Full screen (100% width, 100% height)
 * - 2 windows: Master on left (50%), second window on right (50%), both full height
 * - 3+ windows: Master on left (50%), stack on right (50%) with windows split vertically
 * 
 * Example with 4 windows:
 * ┌─────────────┬─────────────┐
 * │             │   Window 2  │
 * │             ├─────────────┤
 * │   Master    │   Window 3  │
 * │  (Window 1) ├─────────────┤
 * │             │   Window 4  │
 * └─────────────┴─────────────┘
 */

const TilingLayout: React.FC = () => {
  const { state, openLauncher } = useWindowManager();
  const { windows } = state;

  // Empty state
  if (windows.length === 0) {
    return (
      <div className="os-tiling-layout">
        <div className="os-empty-state">
          <h2>Welcome to FV-OS</h2>
          <p>Press <kbd>Alt</kbd> + <kbd>Space</kbd> to open the launcher</p>
          <p>or click anywhere to get started</p>
          <button 
            className="os-toggle-button" 
            onClick={openLauncher}
            style={{ marginTop: '24px' }}
          >
            Open Launcher
          </button>
        </div>
      </div>
    );
  }

  // Single window - full screen
  if (windows.length === 1) {
    return (
      <div className="os-tiling-layout">
        <div className="os-master-layout os-single">
          <div className="os-master-window">
            <Window window={windows[0]} />
          </div>
        </div>
      </div>
    );
  }

  // 2+ windows - master on left, stack on right
  const masterWindow = windows[0];
  const stackWindows = windows.slice(1);

  return (
    <div className="os-tiling-layout">
      <div className="os-master-layout">
        {/* Master window - left side, full height */}
        <div className="os-master-window">
          <Window window={masterWindow} />
        </div>
        
        {/* Stack - right side, windows split vertically */}
        <div className="os-stack">
          {stackWindows.map((win) => (
            <div 
              key={win.id} 
              className="os-stack-window"
              style={{ 
                flex: `1 1 ${100 / stackWindows.length}%`,
                minHeight: 0,
              }}
            >
              <Window window={win} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TilingLayout;
