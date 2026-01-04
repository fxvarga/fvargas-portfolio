import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useWindowManager } from '../context/WindowManagerContext';

const StatusBar: React.FC = () => {
  const navigate = useNavigate();
  const { state, toggleLauncher, toggleShortcutsModal } = useWindowManager();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleExitOS = () => {
    navigate('/');
  };

  return (
    <div className="os-status-bar">
      <div className="os-status-bar-left">
        <button className="os-exit-button" onClick={handleExitOS}>
          Exit to Portfolio
        </button>
        <span 
          style={{ cursor: 'pointer' }} 
          onClick={toggleLauncher}
          title="Open Launcher (Alt+Space)"
        >
          FV-OS
        </span>
      </div>
      <div className="os-status-bar-center">
        <span>{state.windows.length} window{state.windows.length !== 1 ? 's' : ''} open</span>
      </div>
      <div className="os-status-bar-right">
        <span 
          style={{ cursor: 'pointer' }} 
          onClick={toggleShortcutsModal}
          title="Keyboard Shortcuts (Alt+H)"
        >
          ⌨
        </span>
        <span>{formatDate(currentTime)}</span>
        <span style={{ fontWeight: 500 }}>{formatTime(currentTime)}</span>
      </div>
    </div>
  );
};

export default StatusBar;
