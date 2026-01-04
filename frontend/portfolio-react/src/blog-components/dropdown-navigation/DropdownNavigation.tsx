/**
 * DropdownNavigation Demo Component
 * 
 * A Codrops-style animated dropdown navigation inspired by modern design patterns.
 * Features smooth animations, hover states, and responsive behavior.
 */

import React, { useState, useRef, useEffect } from 'react';
import './DropdownNavigation.css';

interface DropdownItem {
  label: string;
  href?: string;
  description?: string;
  icon?: string;
}

interface NavItem {
  label: string;
  dropdown?: DropdownItem[];
  href?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Products',
    dropdown: [
      { label: 'Analytics', description: 'Get insights into your data', icon: '📊' },
      { label: 'Automation', description: 'Streamline your workflows', icon: '⚡' },
      { label: 'Security', description: 'Enterprise-grade protection', icon: '🔒' },
      { label: 'Integrations', description: 'Connect with 100+ tools', icon: '🔗' },
    ],
  },
  {
    label: 'Solutions',
    dropdown: [
      { label: 'For Startups', description: 'Scale from zero to IPO', icon: '🚀' },
      { label: 'For Enterprise', description: 'Built for complexity', icon: '🏢' },
      { label: 'For Developers', description: 'APIs and documentation', icon: '👨‍💻' },
    ],
  },
  {
    label: 'Resources',
    dropdown: [
      { label: 'Documentation', description: 'Guides and references', icon: '📚' },
      { label: 'Blog', description: 'Latest news and updates', icon: '✍️' },
      { label: 'Community', description: 'Join the discussion', icon: '💬' },
      { label: 'Support', description: '24/7 help available', icon: '🎧' },
    ],
  },
  {
    label: 'Pricing',
    href: '#pricing',
  },
];

interface DropdownNavigationProps {
  className?: string;
}

const DropdownNavigation: React.FC<DropdownNavigationProps> = ({ className }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Update indicator position
  useEffect(() => {
    if (activeIndex !== null && itemRefs.current[activeIndex]) {
      const item = itemRefs.current[activeIndex];
      if (item && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
          opacity: 1,
        });
      }
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [activeIndex]);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className={`dropdown-nav-demo ${className || ''}`}>
      <div className="dropdown-nav-container">
        <nav 
          ref={navRef}
          className="dropdown-nav"
          onMouseLeave={handleMouseLeave}
        >
          {/* Sliding indicator */}
          <div 
            className="dropdown-nav-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />
          
          <ul className="dropdown-nav-list">
            {navItems.map((item, index) => (
              <li
                key={index}
                ref={el => itemRefs.current[index] = el}
                className={`dropdown-nav-item ${activeIndex === index ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnter(index)}
              >
                <button className="dropdown-nav-trigger">
                  {item.label}
                  {item.dropdown && (
                    <svg 
                      className="dropdown-nav-arrow" 
                      viewBox="0 0 12 12" 
                      fill="none"
                    >
                      <path 
                        d="M2.5 4.5L6 8L9.5 4.5" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                
                {item.dropdown && (
                  <div className={`dropdown-nav-panel ${activeIndex === index ? 'visible' : ''}`}>
                    <div className="dropdown-nav-panel-content">
                      {item.dropdown.map((dropItem, dropIndex) => (
                        <a 
                          key={dropIndex} 
                          href={dropItem.href || '#'} 
                          className="dropdown-nav-panel-item"
                          onClick={(e) => e.preventDefault()}
                        >
                          <span className="dropdown-nav-panel-icon">{dropItem.icon}</span>
                          <div className="dropdown-nav-panel-text">
                            <span className="dropdown-nav-panel-label">{dropItem.label}</span>
                            {dropItem.description && (
                              <span className="dropdown-nav-panel-desc">{dropItem.description}</span>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="dropdown-nav-info">
          <p>Hover over the navigation items to see the animated dropdowns.</p>
          <p className="dropdown-nav-hint">Features: sliding indicator, staggered animations, smooth transitions</p>
        </div>
      </div>
    </div>
  );
};

export default DropdownNavigation;
