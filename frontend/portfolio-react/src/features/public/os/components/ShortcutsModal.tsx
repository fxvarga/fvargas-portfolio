import React from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { shortcuts } from '../hooks/useKeyboardShortcuts';

const ShortcutsModal: React.FC = () => {
  const { state, closeShortcutsModal } = useWindowManager();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeShortcutsModal();
    }
  };

  if (!state.shortcutsModalOpen) {
    return null;
  }

  return (
    <div className="os-launcher-overlay" onClick={handleOverlayClick}>
      <div className="os-shortcuts-modal">
        <h2>Keyboard Shortcuts</h2>
        <div className="os-shortcut-list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="os-shortcut-item">
              <div className="os-shortcut-keys">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd key={keyIndex}>{key}</kbd>
                ))}
              </div>
              <div className="os-shortcut-description">{shortcut.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
