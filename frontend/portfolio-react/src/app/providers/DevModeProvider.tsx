import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const DevModeContext = createContext<{ devMode: boolean; toggleDevMode: () => void }>({ devMode: false, toggleDevMode: () => { } });

// Create a hook to use the context
export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};

// Create the provider component
export const DevModeProvider = ({ children }) => {
  // Update the initial state to default to true
  const [devMode, setDevMode] = useState(true);

  // Load the saved state on component mount
  useEffect(() => {
    const savedDevMode = localStorage.getItem('dev_mode');
    const isDevModeEnabled = savedDevMode === null ? true : savedDevMode === 'true';
    setDevMode(isDevModeEnabled);

    // Optional: Add a class to the body element for global styling
    if (isDevModeEnabled) {
      document.body.classList.add('dev-mode-active');
    } else {
      document.body.classList.remove('dev-mode-active');
    }
  }, []);

  // Function to toggle dev mode
  const toggleDevMode = () => {
    const newState = !devMode;
    setDevMode(newState);
    localStorage.setItem('dev_mode', newState.toString());

    // Optional: Update body class
    if (newState) {
      document.body.classList.add('dev-mode-active');
    } else {
      document.body.classList.remove('dev-mode-active');
    }
  };

  return (
    <DevModeContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};
