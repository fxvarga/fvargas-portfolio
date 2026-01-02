import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth, Portfolio } from './AuthContext';

// Storage key for selected portfolio
const SELECTED_PORTFOLIO_KEY = 'cms_selected_portfolio';

export interface PortfolioContextType {
  selectedPortfolio: Portfolio | null;
  portfolios: Portfolio[];
  selectPortfolio: (portfolio: Portfolio) => void;
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { portfolios, isAuthenticated } = useAuth();
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize selected portfolio from localStorage or default to first portfolio
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedPortfolio(null);
      setIsLoading(false);
      return;
    }

    const storedPortfolioStr = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
    
    if (storedPortfolioStr) {
      try {
        const storedPortfolio = JSON.parse(storedPortfolioStr) as Portfolio;
        // Verify the stored portfolio is still in the user's accessible portfolios
        const validPortfolio = portfolios.find(p => p.id === storedPortfolio.id);
        if (validPortfolio) {
          setSelectedPortfolio(validPortfolio);
          setIsLoading(false);
          return;
        }
      } catch {
        // Invalid stored data
      }
    }

    // Default to first portfolio if available
    if (portfolios.length > 0) {
      setSelectedPortfolio(portfolios[0]);
      localStorage.setItem(SELECTED_PORTFOLIO_KEY, JSON.stringify(portfolios[0]));
    }
    
    setIsLoading(false);
  }, [isAuthenticated, portfolios]);

  const selectPortfolio = useCallback((portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    localStorage.setItem(SELECTED_PORTFOLIO_KEY, JSON.stringify(portfolio));
  }, []);

  return (
    <PortfolioContext.Provider value={{ 
      selectedPortfolio, 
      portfolios, 
      selectPortfolio,
      isLoading 
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// Get selected portfolio ID for API calls
export const getSelectedPortfolioId = (): string | null => {
  const storedStr = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
  if (storedStr) {
    try {
      const portfolio = JSON.parse(storedStr) as Portfolio;
      return portfolio.id;
    } catch {
      return null;
    }
  }
  return null;
};
