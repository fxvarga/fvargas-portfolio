import React from 'react';
import { useNavigate } from 'react-router';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import TilingLayout from './TilingLayout';
import Launcher from './Launcher';
import ShortcutsModal from './ShortcutsModal';
import StatusBar from './StatusBar';
import '../styles/OSExperience.css';

// Inner component that uses the context
const OSExperienceInner: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="os-experience">
      <StatusBar />
      <TilingLayout />
      <Launcher />
      <ShortcutsModal />
      {/* Mobile notice - only shown on small screens via CSS */}
      <div className="os-mobile-notice">
        Best experienced on desktop with keyboard.{' '}
        <button 
          className="link-button" 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: 0, 
            color: 'inherit', 
            textDecoration: 'underline', 
            cursor: 'pointer',
            font: 'inherit'
          }}
        >
          Switch to standard view
        </button>
      </div>
    </div>
  );
};

// Main component with provider wrapper
const OSExperience: React.FC = () => {
  return (
    <WindowManagerProvider>
      <OSExperienceInner />
    </WindowManagerProvider>
  );
};

export default OSExperience;
