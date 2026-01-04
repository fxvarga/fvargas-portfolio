import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { scroller } from 'react-scroll';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Divider,
  Chip,
  ClickAwayListener,
  Popper,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useSearch, UseSearchOptions } from '../hooks/useSearch';
import { SearchResultItem } from '../../api/searchApi';

export interface SearchBoxProps extends UseSearchOptions {
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show the search box expanded */
  expandedByDefault?: boolean;
  /** Callback when a result is selected */
  onResultSelect?: (result: SearchResultItem) => void;
  /** Callback triggered when a search is executed/result selected */
  onSearchCallback?: () => void;
  /** Custom class name for the container */
  className?: string;
  /** Maximum width of the search box */
  maxWidth?: number | string;
  /** Show entity type chips on results */
  showEntityTypes?: boolean;
  /** Custom styles */
  sx?: Record<string, unknown>;
}

/**
 * Reusable search component with autocomplete and results dropdown
 */
export function SearchBox({
  placeholder = 'Search...',
  expandedByDefault = false,
  onResultSelect,
  onSearchCallback,
  className,
  maxWidth = 400,
  showEntityTypes = true,
  sx,
  ...searchOptions
}: SearchBoxProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    query,
    setQuery,
    results,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    isAvailable,
    executeSearch,
    clearResults,
    selectSuggestion,
  } = useSearch(searchOptions);

  // Show dropdown when focused and has content
  const showDropdown = isFocused && (suggestions.length > 0 || results.length > 0 || isSearching);

  // Combined items for keyboard navigation
  const allItems = [...suggestions.map(s => ({ type: 'suggestion' as const, value: s })), 
                    ...results.map(r => ({ type: 'result' as const, value: r }))];

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions, results]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          const item = allItems[selectedIndex];
          if (item.type === 'suggestion') {
            selectSuggestion(item.value);
          } else {
            handleResultClick(item.value);
          }
        } else if (query.trim()) {
          executeSearch();
          onSearchCallback?.();
        }
        break;
      case 'Escape':
        inputRef.current?.blur();
        setIsFocused(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResultItem) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default navigation behavior
      const url = result.section ? `${result.url}#${result.section}` : result.url;
      const hash = result.section || (result.url.includes('#') ? result.url.split('#')[1] : null);
      const targetPath = result.url.split('#')[0] || '/';
      
      // Check if we're on the same page and have a hash to scroll to
      if (hash && (location.pathname === targetPath || (location.pathname === '/' && targetPath === '/'))) {
        // Same page navigation - scroll directly
        const reactScrollNames = ['home', 'about', 'services', 'contact'];
        if (reactScrollNames.includes(hash)) {
          scroller.scrollTo(hash, {
            duration: 500,
            smooth: true,
            offset: -80,
          });
        } else {
          // For elements with id attributes (e.g., service-1)
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
      // Different page - use navigate
        navigate(url);
      }
    }
    clearResults();
    setIsFocused(false);
    onSearchCallback?.();
  };

  const handleClear = () => {
    clearResults();
    inputRef.current?.focus();
  };

  const formatEntityType = (type: string): string => {
    return type
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Render highlighted snippet with <mark> tags converted to styled spans
  const renderSnippet = (snippet: string) => {
    // Split by <mark> tags and render with highlighting
    const parts = snippet.split(/(<mark>.*?<\/mark>)/g);
    return (
      <Typography variant="body2" color="text.secondary" component="span">
        {parts.map((part, i) => {
          if (part.startsWith('<mark>')) {
            const text = part.replace(/<\/?mark>/g, '');
            return (
              <Box
                key={i}
                component="span"
                sx={{
                  backgroundColor: 'rgba(255, 235, 59, 0.4)',
                  fontWeight: 'medium',
                  borderRadius: '2px',
                  px: 0.25,
                }}
              >
                {text}
              </Box>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </Typography>
    );
  };

  if (!isAvailable) {
    // Show a disabled search box while checking availability, or hide if definitely unavailable
    return null;
  }

  return (
    <ClickAwayListener onClickAway={() => setIsFocused(false)}>
      <Box
        ref={anchorRef}
        className={className}
        sx={{
          position: 'relative',
          width: isExpanded || expandedByDefault ? '100%' : 'auto',
          maxWidth,
          ...sx,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsExpanded(true);
            setIsFocused(true);
          }}
          onBlur={() => {
            if (!expandedByDefault) {
              setTimeout(() => setIsExpanded(false), 200);
            }
          }}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isSearching || isLoadingSuggestions ? (
                  <CircularProgress size={20} />
                ) : query ? (
                  <IconButton size="small" onClick={handleClear}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
            },
          }}
        />

        <Popper
          open={showDropdown}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          style={{ width: anchorRef.current?.offsetWidth, zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={8}
                sx={{
                  mt: 0.5,
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 2,
                }}
              >
                <List dense disablePadding>
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <>
                      <ListItem>
                        <Typography variant="caption" color="text.secondary">
                          Suggestions
                        </Typography>
                      </ListItem>
                      {suggestions.map((suggestion, index) => (
                        <ListItemButton
                          key={`suggestion-${index}`}
                          selected={selectedIndex === index}
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          <SearchIcon
                            fontSize="small"
                            sx={{ mr: 1, color: 'text.secondary' }}
                          />
                          <ListItemText primary={suggestion} />
                        </ListItemButton>
                      ))}
                    </>
                  )}

                  {/* Divider between suggestions and results */}
                  {suggestions.length > 0 && results.length > 0 && <Divider />}

                  {/* Results */}
                  {results.length > 0 && (
                    <>
                      <ListItem>
                        <Typography variant="caption" color="text.secondary">
                          Results
                        </Typography>
                      </ListItem>
                      {results.map((result, index) => {
                        const itemIndex = suggestions.length + index;
                        return (
                          <ListItemButton
                            key={result.id}
                            selected={selectedIndex === itemIndex}
                            onClick={() => handleResultClick(result)}
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="body1" noWrap>
                                    {result.title}
                                  </Typography>
                                  {showEntityTypes && (
                                    <Chip
                                      label={formatEntityType(result.entityType)}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: 20 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={renderSnippet(result.snippet)}
                              secondaryTypographyProps={{
                                component: 'div',
                                sx: {
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                },
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </>
                  )}

                  {/* Loading state */}
                  {isSearching && results.length === 0 && (
                    <ListItem>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 2,
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Searching...
                        </Typography>
                      </Box>
                    </ListItem>
                  )}

                  {/* No results */}
                  {!isSearching &&
                    query.length >= 2 &&
                    suggestions.length === 0 &&
                    results.length === 0 && (
                      <ListItem>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2, textAlign: 'center', width: '100%' }}
                        >
                          No results found for "{query}"
                        </Typography>
                      </ListItem>
                    )}
                </List>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

export default SearchBox;
