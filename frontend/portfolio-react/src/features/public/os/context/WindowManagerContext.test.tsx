import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import {
  WindowManagerProvider,
  useWindowManager,
  WindowApp,
} from './WindowManagerContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WindowManagerProvider>{children}</WindowManagerProvider>
);

// Test window apps
const testApp1: WindowApp = {
  id: 'app-1',
  title: 'Test App 1',
  sectionType: 'about',
  icon: 'ti-user',
};

const testApp2: WindowApp = {
  id: 'app-2',
  title: 'Test App 2',
  sectionType: 'services',
  icon: 'ti-settings',
};

const testApp3: WindowApp = {
  id: 'app-3',
  title: 'Test App 3',
  sectionType: 'contact',
  icon: 'ti-email',
};

describe('WindowManagerProvider and useWindowManager', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper });

    expect(result.current.state.windows).toHaveLength(0);
    expect(result.current.state.activeWindowId).toBeNull();
    expect(result.current.state.launcherOpen).toBe(false);
    expect(result.current.state.shortcutsModalOpen).toBe(false);
  });

  it('throws error when used outside WindowManagerProvider', () => {
    expect(() => {
      renderHook(() => useWindowManager());
    }).toThrow('useWindowManager must be used within a WindowManagerProvider');
  });

  describe('openWindow', () => {
    it('opens a new window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
      });

      expect(result.current.state.windows).toHaveLength(1);
      expect(result.current.state.windows[0].app.id).toBe('app-1');
      expect(result.current.state.windows[0].app.title).toBe('Test App 1');
      expect(result.current.state.activeWindowId).toBe(result.current.state.windows[0].id);
    });

    it('focuses existing window instead of opening duplicate', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
      });

      const firstWindowId = result.current.state.windows[0].id;

      act(() => {
        result.current.openWindow(testApp2);
      });

      act(() => {
        result.current.openWindow(testApp1); // Try to open same app again
      });

      expect(result.current.state.windows).toHaveLength(2);
      expect(result.current.state.activeWindowId).toBe(firstWindowId);
    });

    it('closes launcher when opening window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(true);

      act(() => {
        result.current.openWindow(testApp1);
      });

      expect(result.current.state.launcherOpen).toBe(false);
    });
  });

  describe('closeWindow', () => {
    it('closes a window by id', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
      });

      const windowIdToClose = result.current.state.windows[0].id;

      act(() => {
        result.current.closeWindow(windowIdToClose);
      });

      expect(result.current.state.windows).toHaveLength(1);
      expect(result.current.state.windows[0].app.id).toBe('app-2');
    });

    it('updates activeWindowId when closing active window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
      });

      const activeWindowId = result.current.state.activeWindowId;

      act(() => {
        result.current.closeWindow(activeWindowId!);
      });

      expect(result.current.state.activeWindowId).toBe(result.current.state.windows[0].id);
    });

    it('sets activeWindowId to null when closing last window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
      });

      const windowId = result.current.state.windows[0].id;

      act(() => {
        result.current.closeWindow(windowId);
      });

      expect(result.current.state.windows).toHaveLength(0);
      expect(result.current.state.activeWindowId).toBeNull();
    });
  });

  describe('closeActiveWindow', () => {
    it('closes the currently active window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
      });

      act(() => {
        result.current.closeActiveWindow();
      });

      expect(result.current.state.windows).toHaveLength(1);
      expect(result.current.state.windows[0].app.id).toBe('app-1');
    });

    it('does nothing when no active window', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.closeActiveWindow();
      });

      expect(result.current.state.windows).toHaveLength(0);
    });
  });

  describe('focusWindow', () => {
    it('sets a window as active', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
      });

      const firstWindowId = result.current.state.windows[0].id;

      act(() => {
        result.current.focusWindow(firstWindowId);
      });

      expect(result.current.state.activeWindowId).toBe(firstWindowId);
    });

    it('increments zIndex when focusing', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
      });

      const firstWindow = result.current.state.windows[0];
      const initialZIndex = firstWindow.zIndex;

      act(() => {
        result.current.focusWindow(firstWindow.id);
      });

      const updatedWindow = result.current.state.windows.find(w => w.id === firstWindow.id);
      expect(updatedWindow!.zIndex).toBeGreaterThan(initialZIndex);
    });
  });

  describe('launcher controls', () => {
    it('toggleLauncher opens and closes launcher', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.toggleLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(true);

      act(() => {
        result.current.toggleLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(false);
    });

    it('openLauncher sets launcherOpen to true', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(true);
    });

    it('closeLauncher sets launcherOpen to false', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openLauncher();
        result.current.closeLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(false);
    });

    it('opening launcher closes shortcuts modal', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.toggleShortcutsModal();
      });

      expect(result.current.state.shortcutsModalOpen).toBe(true);

      act(() => {
        result.current.openLauncher();
      });

      expect(result.current.state.shortcutsModalOpen).toBe(false);
      expect(result.current.state.launcherOpen).toBe(true);
    });
  });

  describe('shortcuts modal controls', () => {
    it('toggleShortcutsModal opens and closes modal', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.toggleShortcutsModal();
      });

      expect(result.current.state.shortcutsModalOpen).toBe(true);

      act(() => {
        result.current.toggleShortcutsModal();
      });

      expect(result.current.state.shortcutsModalOpen).toBe(false);
    });

    it('closeShortcutsModal sets shortcutsModalOpen to false', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.toggleShortcutsModal();
        result.current.closeShortcutsModal();
      });

      expect(result.current.state.shortcutsModalOpen).toBe(false);
    });

    it('opening shortcuts modal closes launcher', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openLauncher();
      });

      expect(result.current.state.launcherOpen).toBe(true);

      act(() => {
        result.current.toggleShortcutsModal();
      });

      expect(result.current.state.launcherOpen).toBe(false);
      expect(result.current.state.shortcutsModalOpen).toBe(true);
    });
  });

  describe('window navigation', () => {
    it('focusNextWindow cycles through windows', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
        result.current.openWindow(testApp3);
      });

      // Active should be app3 (last opened)
      const thirdWindowId = result.current.state.windows[2].id;
      expect(result.current.state.activeWindowId).toBe(thirdWindowId);

      act(() => {
        result.current.focusNextWindow();
      });

      // Should wrap to first window
      const firstWindowId = result.current.state.windows[0].id;
      expect(result.current.state.activeWindowId).toBe(firstWindowId);
    });

    it('focusPrevWindow cycles backwards through windows', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.openWindow(testApp1);
        result.current.openWindow(testApp2);
        result.current.openWindow(testApp3);
      });

      // Focus the first window
      const firstWindowId = result.current.state.windows[0].id;
      act(() => {
        result.current.focusWindow(firstWindowId);
      });

      act(() => {
        result.current.focusPrevWindow();
      });

      // Should wrap to last window
      const lastWindowId = result.current.state.windows[2].id;
      expect(result.current.state.activeWindowId).toBe(lastWindowId);
    });

    it('focusNextWindow does nothing with no windows', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.focusNextWindow();
      });

      expect(result.current.state.activeWindowId).toBeNull();
    });

    it('focusPrevWindow does nothing with no windows', () => {
      const { result } = renderHook(() => useWindowManager(), { wrapper });

      act(() => {
        result.current.focusPrevWindow();
      });

      expect(result.current.state.activeWindowId).toBeNull();
    });
  });
});
