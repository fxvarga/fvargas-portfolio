import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useAuth, Portfolio } from './AuthContext';

// Storage key for selected portfolio
const SELECTED_PORTFOLIO_KEY = 'cms_selected_portfolio';

export interface PortfolioContextType {
  selectedPortfolio: Portfolio | null;
  portfolios: Portfolio[];
  selectPortfolio: (portfolio: Portfolio) => void;
  isLoading: boolean;
  isDomainLocked: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { portfolios, isAuthenticated } = useAuth();
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if the current domain matches a specific portfolio
  const domainLockedPortfolio = useMemo(() => {
    const currentHost = window.location.hostname;
    return portfolios.find(p => p.domain && currentHost === p.domain) || null;
  }, [portfolios]);

  const isDomainLocked = domainLockedPortfolio !== null;

  // Filter portfolios: if domain-locked, only show that one
  const availablePortfolios = useMemo(() => {
    if (isDomainLocked) return [domainLockedPortfolio!];
    return portfolios;
  }, [portfolios, isDomainLocked, domainLockedPortfolio]);

  // Initialize selected portfolio from domain lock, localStorage, or default to first
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedPortfolio(null);
      setIsLoading(false);
      return;
    }

    // If domain-locked, always use that portfolio
    if (domainLockedPortfolio) {
      setSelectedPortfolio(domainLockedPortfolio);
      localStorage.setItem(SELECTED_PORTFOLIO_KEY, JSON.stringify(domainLockedPortfolio));
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
  }, [isAuthenticated, portfolios, domainLockedPortfolio]);

  const selectPortfolio = useCallback((portfolio: Portfolio) => {
    // Don't allow switching if domain-locked
    if (domainLockedPortfolio) return;
    setSelectedPortfolio(portfolio);
    localStorage.setItem(SELECTED_PORTFOLIO_KEY, JSON.stringify(portfolio));
  }, [domainLockedPortfolio]);

  return (
    <PortfolioContext.Provider value={{ 
      selectedPortfolio, 
      portfolios: availablePortfolios, 
      selectPortfolio,
      isLoading,
      isDomainLocked
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
