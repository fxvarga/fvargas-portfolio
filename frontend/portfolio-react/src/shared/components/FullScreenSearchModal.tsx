import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearch, UseSearchOptions } from '../hooks/useSearch';
import { SearchResultItem } from '../../api/searchApi';
import './FullScreenSearchModal.css';

// Import icons (assuming these exist in the project based on Launcher.tsx usage)
// If not, we can use simple SVGs
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

interface FullScreenSearchModalProps extends UseSearchOptions {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}

export const FullScreenSearchModal: React.FC<FullScreenSearchModalProps> = ({
  isOpen,
  onClose,
  placeholder = "Search...",
  ...searchOptions
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    query,
    setQuery,
    results,
    suggestions,
    isSearching,
    selectSuggestion,
    clearResults,
  } = useSearch(searchOptions);

  // Combine suggestions and results for unified navigation
  const allItems = [
    ...suggestions.map(s => ({ type: 'suggestion' as const, value: s })),
    ...results.map(r => ({ type: 'result' as const, value: r }))
  ];

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
      setQuery('');
      clearResults();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, setQuery, clearResults]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions, results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          if (item.type === 'suggestion') {
            selectSuggestion(item.value);
          } else {
            handleResultClick(item.value);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleResultClick = (result: SearchResultItem) => {
    // Check if the result is a service page and route to /work/:slug
    if (result.entityType === 'service') {
      // Extract slug from URL if possible, or use ID/title logic if needed
      // Assuming result.url might already be formatted, but if we need strict control:
      // We can also check if the URL already follows the pattern.
      // If the backend returns URLs like /#service-slug, we need to adapt.
      
      // Since the user specified /work/service-name route for services:
      const slug = result.url.split('#').pop() || ''; // Extract part after hash if it exists
      if (slug) {
         navigate(`/work/${slug}`);
      } else {
         // Fallback if no slug found
         navigate(result.url);
      }
    } else {
      const url = result.section ? `${result.url}#${result.section}` : result.url;
      navigate(url);
    }
    onClose();
  };

  // Helper to render icon based on item type
  const renderIcon = (type: string) => {
    // Determine icon class based on type (mimicking Launcher.tsx logic)
    let iconClass = 'flaticon-right-arrow';
    if (type === 'page') iconClass = 'flaticon-layers';
    if (type === 'service') iconClass = 'flaticon-briefcase';
    if (type === 'blog') iconClass = 'flaticon-edit';
    
    // We add 'fi' class as seen in Launcher.tsx to ensure font family is applied if needed
    // although the flaticon.css seems to target [class^="flaticon-"]
    return <i className={`fi ${iconClass}`} style={{ fontStyle: 'normal' }}></i>;
  };

  if (!isOpen) return null;

  return (
    <div className="fs-search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fs-search-modal">
        {/* Header */}
        <div className="fs-search-header">
          <div className="fs-search-icon"><SearchIcon /></div>
          <input
            ref={inputRef}
            type="text"
            className="fs-search-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="fs-close-btn" onClick={onClose}>
            {query ? 'Clear' : 'Close'}
          </button>
        </div>

        {/* Content */}
        <div className="fs-search-content">
          {/* Suggestions Section */}
          {suggestions.length > 0 && (
            <>
              <div className="fs-section-title">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${index}`}
                  className={`fs-item ${selectedIndex === index ? 'focused' : ''}`}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="fs-item-icon">
                    <SearchIcon />
                  </div>
                  <div className="fs-item-details">
                    <div className="fs-item-title">{suggestion}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <>
              <div className="fs-section-title">Results</div>
              {results.map((result, index) => {
                const globalIndex = suggestions.length + index;
                return (
                  <div
                    key={result.id}
                    className={`fs-item ${selectedIndex === globalIndex ? 'focused' : ''}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="fs-item-icon">
                      {renderIcon(result.entityType)}
                    </div>
                    <div className="fs-item-details">
                      <div className="fs-item-title">{result.title}</div>
                      <div className="fs-item-subtitle" dangerouslySetInnerHTML={{ __html: result.snippet }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Empty States */}
          {!isSearching && query.trim() && allItems.length === 0 && (
            <div className="fs-message">
              No results found for "{query}"
            </div>
          )}

          {isSearching && (
            <div className="fs-message">
              Searching...
            </div>
          )}
        </div>

        {/* Footer (Desktop Only) */}
        <div className="fs-footer">
          <span><span className="fs-key">↑</span><span className="fs-key">↓</span> to navigate</span>
          <span><span className="fs-key">Enter</span> to select</span>
          <span><span className="fs-key">Esc</span> to close</span>
        </div>
      </div>
    </div>
  );
};
