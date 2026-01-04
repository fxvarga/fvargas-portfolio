import { useEffect, useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';

export const useKeyboardShortcuts = () => {
  const {
    toggleLauncher,
    closeActiveWindow,
    toggleShortcutsModal,
    focusNextWindow,
    focusPrevWindow,
    closeLauncher,
    closeShortcutsModal,
  } = useWindowManager();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Escape closes modals
    if (event.key === 'Escape') {
      closeLauncher();
      closeShortcutsModal();
      return;
    }

    // Alt + key combinations
    if (event.altKey) {
      switch (event.key.toLowerCase()) {
        case ' ': // Alt + Space - Toggle launcher
          event.preventDefault();
          toggleLauncher();
          break;
        case 'w': // Alt + W - Close active window
          event.preventDefault();
          closeActiveWindow();
          break;
        case 'h': // Alt + H - Toggle shortcuts help
        case '?': // Alt + ? - Toggle shortcuts help
          event.preventDefault();
          toggleShortcutsModal();
          break;
        case 'tab': // Alt + Tab - Focus next window
          event.preventDefault();
          if (event.shiftKey) {
            focusPrevWindow();
          } else {
            focusNextWindow();
          }
          break;
        case 'j': // Alt + J - Focus next window (vim-style)
          event.preventDefault();
          focusNextWindow();
          break;
        case 'k': // Alt + K - Focus previous window (vim-style)
          event.preventDefault();
          focusPrevWindow();
          break;
        default:
          break;
      }
    }
  }, [
    toggleLauncher,
    closeActiveWindow,
    toggleShortcutsModal,
    focusNextWindow,
    focusPrevWindow,
    closeLauncher,
    closeShortcutsModal,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export const shortcuts = [
  { keys: ['Alt', 'Space'], description: 'Open launcher menu' },
  { keys: ['Alt', 'W'], description: 'Close focused window' },
  { keys: ['Alt', 'Tab'], description: 'Focus next window' },
  { keys: ['Alt', 'Shift', 'Tab'], description: 'Focus previous window' },
  { keys: ['Alt', 'J'], description: 'Focus next window (vim)' },
  { keys: ['Alt', 'K'], description: 'Focus previous window (vim)' },
  { keys: ['Alt', 'H'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modals' },
];
