import React from 'react';
import { Window as WindowType } from '../context/WindowManagerContext';
import { useWindowManager } from '../context/WindowManagerContext';
import ContentRenderer from './ContentRenderer';

interface WindowProps {
  window: WindowType;
}

const Window: React.FC<WindowProps> = ({ window: win }) => {
  const { state, focusWindow, closeWindow } = useWindowManager();
  const isActive = state.activeWindowId === win.id;

  const handleFocus = () => {
    if (!isActive) {
      focusWindow(win.id);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(win.id);
  };

  return (
    <div
      className={`os-window ${isActive ? 'active' : ''}`}
      onClick={handleFocus}
      style={{ zIndex: win.zIndex }}
    >
      <div className="os-window-titlebar">
        <div className="os-window-title">
          {win.app.icon && <i className={`fi ${win.app.icon}`}></i>}
          <span>{win.app.title}</span>
        </div>
        <div className="os-window-controls">
          <button
            className="os-window-control minimize"
            title="Minimize (not implemented)"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="os-window-control maximize"
            title="Maximize (not implemented)"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="os-window-control close"
            title="Close (Alt+W)"
            onClick={handleClose}
          />
        </div>
      </div>
      <div className="os-window-content">
        <ContentRenderer app={win.app} />
      </div>
    </div>
  );
};

export default Window;
