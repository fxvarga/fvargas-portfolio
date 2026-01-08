/**
 * Animated Tab Navigation Demo Component
 *
 * Smooth tab navigation with sliding indicators, content transitions,
 * and customizable animation styles using React and CSS.
 */

import React, { useState } from 'react';
import './AnimatedTabNavigation.css';

// 1. First, define the CORE component that users will learn to build
interface TabData {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

interface AnimatedTabNavigationProps {
  tabs: TabData[];
  defaultActiveTab?: string;
  animationType?: 'slide' | 'fade' | 'scale' | 'flip';
  indicatorStyle?: 'underline' | 'background' | 'border' | 'pill';
  className?: string;
}

const AnimatedTabNavigation: React.FC<AnimatedTabNavigationProps> = ({
  tabs,
  defaultActiveTab = tabs[0]?.id || '',
  animationType = 'slide',
  indicatorStyle = 'underline',
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  // For slide animation, use transform on wrapper
  // For other animations, show only active tab with CSS animations
  const isSlideAnimation = animationType === 'slide';

  return (
    <div className={`animated-tab-navigation ${className || ''}`}>
      <div className={`tab-navigation ${indicatorStyle}`}>
        <div
          className="tab-indicator"
          style={{
            transform: `translateX(${activeTabIndex * 100}%)`,
            width: `${100 / tabs.length}%`
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={`tab-content-container ${animationType}`}>
        {isSlideAnimation ? (
          <div
            className="tab-content-wrapper"
            style={{
              transform: `translateX(-${activeTabIndex * (100 / tabs.length)}%)`,
              width: `${tabs.length * 100}%`
            }}
          >
            {tabs.map((tab) => (
              <div 
                key={tab.id} 
                className="tab-pane"
                style={{ width: `${100 / tabs.length}%` }}
              >
                {tab.content}
              </div>
            ))}
          </div>
        ) : (
          <div className="tab-content-single">
            {tabs.map((tab) => (
              <div 
                key={tab.id} 
                className={`tab-pane-animated ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Then, create the DEMO wrapper with interactive controls
interface DemoProps {
  className?: string;
}

const AnimatedTabNavigationDemo: React.FC<DemoProps> = ({ className }) => {
  const [animationType, setAnimationType] = useState<'slide' | 'fade' | 'scale' | 'flip'>('slide');
  const [indicatorStyle, setIndicatorStyle] = useState<'underline' | 'background' | 'border' | 'pill'>('underline');

  const demoTabs: TabData[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      content: (
        <div className="tab-content">
          <h3>Project Overview</h3>
          <p>This comprehensive dashboard provides insights into project metrics, team performance, and key milestones. Track progress across multiple dimensions with real-time updates and interactive visualizations.</p>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">24</span>
              <span className="stat-label">Active Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">156</span>
              <span className="stat-label">Team Members</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">89%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      content: (
        <div className="tab-content">
          <h3>Data Analytics</h3>
          <p>Dive deep into performance metrics with advanced analytics tools. Monitor trends, identify patterns, and make data-driven decisions with comprehensive reporting and visualization capabilities.</p>
          <div className="chart-placeholder">
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '80%' }}></div>
            <div className="chart-bar" style={{ height: '40%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '70%' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'team',
      label: 'Team',
      icon: '👥',
      content: (
        <div className="tab-content">
          <h3>Team Management</h3>
          <p>Manage team members, roles, and responsibilities with our intuitive team management interface. Assign tasks, track progress, and foster collaboration across your organization.</p>
          <div className="team-members">
            <div className="member-card">
              <div className="member-avatar">👨‍💼</div>
              <div className="member-info">
                <h4>John Smith</h4>
                <p>Project Manager</p>
              </div>
            </div>
            <div className="member-card">
              <div className="member-avatar">👩‍💻</div>
              <div className="member-info">
                <h4>Sarah Johnson</h4>
                <p>Lead Developer</p>
              </div>
            </div>
            <div className="member-card">
              <div className="member-avatar">🎨</div>
              <div className="member-info">
                <h4>Mike Chen</h4>
                <p>UI/UX Designer</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      content: (
        <div className="tab-content">
          <h3>System Settings</h3>
          <p>Configure system preferences, user permissions, and integration settings. Customize your workspace to match your team's workflow and requirements.</p>
          <div className="settings-list">
            <div className="setting-item">
              <label>Notifications</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="setting-item">
              <label>Auto-save</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="setting-item">
              <label>Dark Mode</label>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`animated-tab-navigation-demo ${className || ''}`}>
      {/* Demo Header */}
      <div className="demo-header">
        <h4>Animated Tab Navigation</h4>
        <p>Smooth tab transitions with sliding indicators and content animations</p>
      </div>

      {/* Showcase Area - where the component is displayed */}
      <div className="animated-tab-navigation-showcase">
        <AnimatedTabNavigation
          tabs={demoTabs}
          animationType={animationType}
          indicatorStyle={indicatorStyle}
        />
      </div>

      {/* Demo Controls - sliders, inputs, buttons to modify the component */}
      <div className="demo-controls">
        <div className="control-group">
          <label>Animation Type:</label>
          <select
            value={animationType}
            onChange={(e) => setAnimationType(e.target.value as typeof animationType)}
          >
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
            <option value="scale">Scale</option>
            <option value="flip">Flip</option>
          </select>
        </div>

        <div className="control-group">
          <label>Indicator Style:</label>
          <select
            value={indicatorStyle}
            onChange={(e) => setIndicatorStyle(e.target.value as typeof indicatorStyle)}
          >
            <option value="underline">Underline</option>
            <option value="background">Background</option>
            <option value="border">Border</option>
            <option value="pill">Pill</option>
          </select>
        </div>
      </div>

      {/* Demo Info - how it works summary */}
      <div className="demo-info">
        <h5>How It Works</h5>
        <ul>
          <li>Sliding indicator uses CSS transforms to smoothly move between tabs</li>
          <li>Content transitions use horizontal sliding for the 'slide' animation</li>
          <li>Other animations (fade, scale, flip) are applied to individual tab panes</li>
          <li>Indicator styles change the visual appearance and positioning</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimatedTabNavigationDemo;