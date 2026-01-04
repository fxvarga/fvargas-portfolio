import React, { useState, useRef, useEffect } from 'react';
import { useWindowManager, WindowApp, SectionType } from '../context/WindowManagerContext';
import { useServices } from '../../../../shared/hooks/useCMS';

interface LauncherItem {
  id: string;
  title: string;
  subtitle?: string;
  sectionType: SectionType;
  icon?: string;
  slug?: string;
}

// Core section apps
const coreApps: LauncherItem[] = [
  { id: 'hero', title: 'Home', subtitle: 'Welcome & Introduction', sectionType: 'hero', icon: 'flaticon-home' },
  { id: 'about', title: 'About', subtitle: 'Background & Experience', sectionType: 'about', icon: 'flaticon-user' },
  { id: 'services', title: 'Services', subtitle: 'Featured Work & Skills', sectionType: 'services', icon: 'flaticon-layers' },
  { id: 'contact', title: 'Contact', subtitle: 'Get in Touch', sectionType: 'contact', icon: 'flaticon-email' },
];

const Launcher: React.FC = () => {
  const { state, closeLauncher, openWindow } = useWindowManager();
  const { services } = useServices();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build work items from CMS services
  const workItems: LauncherItem[] = services?.services?.map((service) => ({
    id: `work-${service.slug || service.id}`,
    title: service.title,
    subtitle: service.description,
    sectionType: 'work' as SectionType,
    icon: service.icon,
    slug: service.slug,
  })) || [];

  // All items combined
  const allItems = [...coreApps, ...workItems];

  // Filter items based on search query
  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group filtered items
  const coreFiltered = filteredItems.filter(item => coreApps.some(c => c.id === item.id));
  const workFiltered = filteredItems.filter(item => workItems.some(w => w.id === item.id));

  // Focus search input when launcher opens
  useEffect(() => {
    if (state.launcherOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [state.launcherOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeLauncher();
        break;
    }
  };

  const handleItemClick = (item: LauncherItem) => {
    const app: WindowApp = {
      id: item.id,
      title: item.title,
      sectionType: item.sectionType,
      icon: item.icon,
      slug: item.slug,
    };
    openWindow(app);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeLauncher();
    }
  };

  if (!state.launcherOpen) {
    return null;
  }

  return (
    <div className="os-launcher-overlay" onClick={handleOverlayClick}>
      <div className="os-launcher" onKeyDown={handleKeyDown}>
        <div className="os-launcher-header">
          <input
            ref={searchInputRef}
            type="text"
            className="os-launcher-search"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>
        <div className="os-launcher-content">
          {coreFiltered.length > 0 && (
            <div className="os-launcher-section">
              <h3 className="os-launcher-section-title">Sections</h3>
              {coreFiltered.map((item, index) => {
                const globalIndex = filteredItems.indexOf(item);
                return (
                  <button
                    key={item.id}
                    className={`os-launcher-item ${globalIndex === selectedIndex ? 'focused' : ''}`}
                    onClick={() => handleItemClick(item)}
                    style={globalIndex === selectedIndex ? { background: 'rgba(194, 106, 45, 0.2)' } : {}}
                  >
                    <i className={`fi ${item.icon || 'flaticon-right-arrow'}`}></i>
                    <div className="os-launcher-item-text">
                      <div className="os-launcher-item-title">{item.title}</div>
                      {item.subtitle && (
                        <div className="os-launcher-item-subtitle">{item.subtitle}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {workFiltered.length > 0 && (
            <div className="os-launcher-section">
              <h3 className="os-launcher-section-title">Work & Projects</h3>
              {workFiltered.map((item) => {
                const globalIndex = filteredItems.indexOf(item);
                return (
                  <button
                    key={item.id}
                    className={`os-launcher-item ${globalIndex === selectedIndex ? 'focused' : ''}`}
                    onClick={() => handleItemClick(item)}
                    style={globalIndex === selectedIndex ? { background: 'rgba(194, 106, 45, 0.2)' } : {}}
                  >
                    <i className={`fi ${item.icon || 'flaticon-briefcase'}`}></i>
                    <div className="os-launcher-item-text">
                      <div className="os-launcher-item-title">{item.title}</div>
                      {item.subtitle && (
                        <div className="os-launcher-item-subtitle">
                          {item.subtitle.length > 60 
                            ? item.subtitle.substring(0, 60) + '...' 
                            : item.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {filteredItems.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Launcher;
