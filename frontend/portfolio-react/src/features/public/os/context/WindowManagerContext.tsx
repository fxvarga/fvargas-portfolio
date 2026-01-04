import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Window application types - driven by CMS section types
export type SectionType = 'hero' | 'about' | 'services' | 'contact' | 'work';

export interface WindowApp {
  id: string;
  title: string;
  sectionType: SectionType;
  icon?: string;
  slug?: string; // For work items
}

export interface Window {
  id: string;
  app: WindowApp;
  zIndex: number;
}

interface WindowManagerState {
  windows: Window[];
  activeWindowId: string | null;
  launcherOpen: boolean;
  shortcutsModalOpen: boolean;
  nextZIndex: number;
}

type WindowManagerAction =
  | { type: 'OPEN_WINDOW'; payload: WindowApp }
  | { type: 'CLOSE_WINDOW'; payload: string }
  | { type: 'FOCUS_WINDOW'; payload: string }
  | { type: 'CLOSE_ACTIVE_WINDOW' }
  | { type: 'TOGGLE_LAUNCHER' }
  | { type: 'OPEN_LAUNCHER' }
  | { type: 'CLOSE_LAUNCHER' }
  | { type: 'TOGGLE_SHORTCUTS_MODAL' }
  | { type: 'CLOSE_SHORTCUTS_MODAL' }
  | { type: 'FOCUS_NEXT_WINDOW' }
  | { type: 'FOCUS_PREV_WINDOW' };

const initialState: WindowManagerState = {
  windows: [],
  activeWindowId: null,
  launcherOpen: false,
  shortcutsModalOpen: false,
  nextZIndex: 1,
};

function windowManagerReducer(state: WindowManagerState, action: WindowManagerAction): WindowManagerState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      // Check if window with same app id already exists
      const existingWindow = state.windows.find(w => w.app.id === action.payload.id);
      if (existingWindow) {
        // Focus the existing window instead
        return {
          ...state,
          activeWindowId: existingWindow.id,
          windows: state.windows.map(w =>
            w.id === existingWindow.id
              ? { ...w, zIndex: state.nextZIndex }
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
          launcherOpen: false,
        };
      }

      const newWindow: Window = {
        id: `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        app: action.payload,
        zIndex: state.nextZIndex,
      };

      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        nextZIndex: state.nextZIndex + 1,
        launcherOpen: false,
      };
    }

    case 'CLOSE_WINDOW': {
      const filteredWindows = state.windows.filter(w => w.id !== action.payload);
      const newActiveId = state.activeWindowId === action.payload
        ? (filteredWindows.length > 0 ? filteredWindows[filteredWindows.length - 1].id : null)
        : state.activeWindowId;

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
      };
    }

    case 'CLOSE_ACTIVE_WINDOW': {
      if (!state.activeWindowId) return state;
      const filteredWindows = state.windows.filter(w => w.id !== state.activeWindowId);
      const newActiveId = filteredWindows.length > 0 
        ? filteredWindows[filteredWindows.length - 1].id 
        : null;

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
      };
    }

    case 'FOCUS_WINDOW': {
      return {
        ...state,
        activeWindowId: action.payload,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, zIndex: state.nextZIndex }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'TOGGLE_LAUNCHER':
      return { ...state, launcherOpen: !state.launcherOpen, shortcutsModalOpen: false };

    case 'OPEN_LAUNCHER':
      return { ...state, launcherOpen: true, shortcutsModalOpen: false };

    case 'CLOSE_LAUNCHER':
      return { ...state, launcherOpen: false };

    case 'TOGGLE_SHORTCUTS_MODAL':
      return { ...state, shortcutsModalOpen: !state.shortcutsModalOpen, launcherOpen: false };

    case 'CLOSE_SHORTCUTS_MODAL':
      return { ...state, shortcutsModalOpen: false };

    case 'FOCUS_NEXT_WINDOW': {
      if (state.windows.length === 0) return state;
      const currentIndex = state.windows.findIndex(w => w.id === state.activeWindowId);
      const nextIndex = (currentIndex + 1) % state.windows.length;
      const nextWindow = state.windows[nextIndex];
      return {
        ...state,
        activeWindowId: nextWindow.id,
        windows: state.windows.map(w =>
          w.id === nextWindow.id
            ? { ...w, zIndex: state.nextZIndex }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'FOCUS_PREV_WINDOW': {
      if (state.windows.length === 0) return state;
      const currentIndex = state.windows.findIndex(w => w.id === state.activeWindowId);
      const prevIndex = currentIndex <= 0 ? state.windows.length - 1 : currentIndex - 1;
      const prevWindow = state.windows[prevIndex];
      return {
        ...state,
        activeWindowId: prevWindow.id,
        windows: state.windows.map(w =>
          w.id === prevWindow.id
            ? { ...w, zIndex: state.nextZIndex }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    }

    default:
      return state;
  }
}

interface WindowManagerContextValue {
  state: WindowManagerState;
  openWindow: (app: WindowApp) => void;
  closeWindow: (windowId: string) => void;
  closeActiveWindow: () => void;
  focusWindow: (windowId: string) => void;
  toggleLauncher: () => void;
  openLauncher: () => void;
  closeLauncher: () => void;
  toggleShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  focusNextWindow: () => void;
  focusPrevWindow: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(windowManagerReducer, initialState);

  const openWindow = useCallback((app: WindowApp) => {
    dispatch({ type: 'OPEN_WINDOW', payload: app });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: windowId });
  }, []);

  const closeActiveWindow = useCallback(() => {
    dispatch({ type: 'CLOSE_ACTIVE_WINDOW' });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: windowId });
  }, []);

  const toggleLauncher = useCallback(() => {
    dispatch({ type: 'TOGGLE_LAUNCHER' });
  }, []);

  const openLauncher = useCallback(() => {
    dispatch({ type: 'OPEN_LAUNCHER' });
  }, []);

  const closeLauncher = useCallback(() => {
    dispatch({ type: 'CLOSE_LAUNCHER' });
  }, []);

  const toggleShortcutsModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHORTCUTS_MODAL' });
  }, []);

  const closeShortcutsModal = useCallback(() => {
    dispatch({ type: 'CLOSE_SHORTCUTS_MODAL' });
  }, []);

  const focusNextWindow = useCallback(() => {
    dispatch({ type: 'FOCUS_NEXT_WINDOW' });
  }, []);

  const focusPrevWindow = useCallback(() => {
    dispatch({ type: 'FOCUS_PREV_WINDOW' });
  }, []);

  return (
    <WindowManagerContext.Provider
      value={{
        state,
        openWindow,
        closeWindow,
        closeActiveWindow,
        focusWindow,
        toggleLauncher,
        openLauncher,
        closeLauncher,
        toggleShortcutsModal,
        closeShortcutsModal,
        focusNextWindow,
        focusPrevWindow,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = (): WindowManagerContextValue => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
