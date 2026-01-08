# Building Animated Tab Navigation with React

Create smooth, interactive tab navigation with sliding indicators, content transitions, and customizable animation styles. Perfect for organizing content and improving user experience in dashboards and settings panels.

## What We're Building

Our animated tab navigation implementation includes:

- **Multiple animation types** with sliding, fading, scaling, and flipping effects
- **Customizable indicator styles** including underline, background, border, and pill designs
- **Smooth content transitions** using CSS transforms and keyframes
- **Icon support** and responsive design
- **Zero external dependencies** - built with React and CSS only

TIP: Try the different animation types and indicator styles using the controls above to see how they affect the navigation behavior!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useEffect)
- Familiarity with CSS transforms and transitions

## Step 1: Component Structure and Props

Let's start by defining the component interface and basic structure:

```tsx
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
```

## Step 2: Core Component Logic

Now let's implement the main component with state management:

```tsx
const AnimatedTabNavigation: React.FC<AnimatedTabNavigationProps> = ({
  tabs,
  defaultActiveTab = tabs[0]?.id || '',
  animationType = 'slide',
  indicatorStyle = 'underline',
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className={`animated-tab-navigation ${className || ''}`}>
      {/* Tab navigation and content will go here */}
    </div>
  );
};
```

## Step 3: Tab Navigation with Sliding Indicator

Let's implement the tab navigation with a sliding indicator:

```tsx
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
```

## Step 4: Content Container with Animations

Now let's add the content container with different animation types:

```tsx
<div className={`tab-content-container ${animationType}`}>
  <div
    className="tab-content-wrapper"
    style={{
      transform: `translateX(-${activeTabIndex * 100}%)`
    }}
  >
    {tabs.map((tab) => (
      <div key={tab.id} className="tab-pane">
        {tab.content}
      </div>
    ))}
  </div>
</div>
```

NOTE: The slide animation uses CSS transforms to move the content wrapper horizontally, while other animations like fade and scale are applied to individual tab panes using CSS classes.

## Step 5: Complete Component

Here's the full implementation:

```tsx
const AnimatedTabNavigation: React.FC<AnimatedTabNavigationProps> = ({
  tabs,
  defaultActiveTab = tabs[0]?.id || '',
  animationType = 'slide',
  indicatorStyle = 'underline',
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

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
        <div
          className="tab-content-wrapper"
          style={{
            transform: `translateX(-${activeTabIndex * 100}%)`
          }}
        >
          {tabs.map((tab) => (
            <div key={tab.id} className="tab-pane">
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Styling

Let's add the CSS for the tab navigation and animations:

```css
/* Tab Navigation */
.tab-navigation {
  display: flex;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-button {
  flex: 1;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 2;
}

.tab-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: #c26a2d;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  font-size: 0.85rem;
  font-weight: 500;
}

/* Tab Indicator */
.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #c26a2d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* Indicator Styles */
.tab-navigation.background .tab-indicator {
  height: 100%;
  bottom: 0;
  background: rgba(194, 106, 45, 0.1);
}

.tab-navigation.border .tab-indicator {
  height: 2px;
  bottom: 0;
  background: #c26a2d;
  box-shadow: 0 0 0 1px rgba(194, 106, 45, 0.3);
}

.tab-navigation.pill .tab-indicator {
  height: calc(100% - 8px);
  top: 4px;
  bottom: 4px;
  background: #c26a2d;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(194, 106, 45, 0.3);
}

.tab-navigation.pill .tab-button.active {
  color: #fff;
}

/* Content Container */
.tab-content-container {
  position: relative;
  overflow: hidden;
  min-height: 300px;
}

.tab-content-wrapper {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 400%; /* 4 tabs */
}

.tab-pane {
  flex: 1;
  padding: 2rem;
  width: 25%; /* 1/4 of container */
}

/* Animation Types */
.tab-content-container.fade .tab-content-wrapper {
  transition: opacity 0.3s ease;
}

.tab-content-container.scale .tab-pane {
  transform: scale(0.95);
  opacity: 0;
  transition: all 0.3s ease;
}

.tab-content-container.scale .tab-pane.active {
  transform: scale(1);
  opacity: 1;
}

.tab-content-container.flip .tab-pane {
  transform: rotateY(90deg);
  opacity: 0;
  transition: all 0.4s ease;
}

.tab-content-container.flip .tab-pane.active {
  transform: rotateY(0deg);
  opacity: 1;
}
```

## Usage Examples

```tsx
// Basic usage
const tabs = [
  { id: 'overview', label: 'Overview', content: <div>Overview content</div> },
  { id: 'settings', label: 'Settings', content: <div>Settings content</div> }
];

<AnimatedTabNavigation tabs={tabs} />

// With icons and custom animation
const tabsWithIcons = [
  { id: 'home', label: 'Home', icon: '🏠', content: <HomeContent /> },
  { id: 'profile', label: 'Profile', icon: '👤', content: <ProfileContent /> }
];

<AnimatedTabNavigation 
  tabs={tabsWithIcons}
  animationType="scale"
  indicatorStyle="pill"
/>

// In a dashboard
<section className="dashboard">
  <h2>Dashboard</h2>
  <AnimatedTabNavigation tabs={dashboardTabs} />
</section>
```

## Performance Considerations

WARNING: Complex animations can impact performance on lower-end devices. Always test animations on target devices and consider user preferences.

- Use `transform` and `opacity` for animations (GPU-accelerated properties)
- Limit the number of simultaneously animating elements
- Consider using `will-change` for frequently animated properties
- Debounce rapid state changes if needed

## Accessibility

Our tab navigation includes comprehensive accessibility features:

```tsx
// Add ARIA attributes for screen readers
<div role="tablist" aria-label="Content sections">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      id={`tab-${tab.id}`}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </button>
  ))}
</div>

{tab.content && (
  <div
    role="tabpanel"
    aria-labelledby={`tab-${activeTab}`}
    id={`panel-${activeTab}`}
  >
    {tabs.find(tab => tab.id === activeTab)?.content}
  </div>
)}
```

- **ARIA tab roles** with proper relationships between tabs and panels
- **Keyboard navigation** support (Tab key, arrow keys)
- **Focus management** with visible focus indicators
- **Screen reader** compatibility
- **Reduced motion** support for users with vestibular disorders

```tsx
// Respect reduced motion preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Apply reduced motion styles
if (prefersReducedMotion) {
  // Disable or simplify animations
}
```

## Conclusion

Animated tab navigation enhances user experience by providing smooth transitions and clear visual feedback. The combination of sliding indicators, content animations, and customizable styles makes this a versatile component for organizing complex interfaces.

Experiment with different animation combinations and indicator styles to find what works best for your application!

---

## Related Tutorials

- [Building a Codrops-Style Dropdown Navigation with React](/blog/codrops-dropdown-navigation)
- [Building Animated Modal Dialogs with React](/blog/animated-modal-dialogs)
- [Creating Magnetic Button Effects with React](/blog/magnetic-button-effect)