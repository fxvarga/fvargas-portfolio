/**
 * Blog Demo Component Registry
 * 
 * This registry provides lazy-loaded demo components for blog posts.
 * Each blog post can reference a demo component by name, and this
 * registry handles loading and rendering the appropriate component.
 */

import React, { lazy, Suspense, ComponentType } from 'react';

// Lazy load demo components
const DropdownNavigation = lazy(() => import('./dropdown-navigation/DropdownNavigation'));
const AnimatedCounter = lazy(() => import('./animated-counter/AnimatedCounter'));
const MagneticButton = lazy(() => import('./magnetic-button/MagneticButton'));
const TypingEffect = lazy(() => import('./typing-effect/TypingEffect'));
const WorkflowExecutor = lazy(() => import('./workflow-executor/WorkflowExecutor'));
const FluentUIDataGrid = lazy(() => import('./fluentui-datagrid/FluentUIDataGrid'));
const FileUploadProgress = lazy(() => import('./file-upload-progress/FileUploadProgress'));
const PhotoGallery = lazy(() => import('./photo-gallery/PhotoGallery'));

// Demo component type
interface DemoComponentProps {
  className?: string;
}

// Registry of available demo components
const demoRegistry: Record<string, ComponentType<DemoComponentProps>> = {
  'dropdown-navigation': DropdownNavigation,
  'animated-counter': AnimatedCounter,
  'magnetic-button': MagneticButton,
  'typing-effect': TypingEffect,
  'workflow-executor': WorkflowExecutor,
  'fluentui-datagrid': FluentUIDataGrid,
  'file-upload-progress': FileUploadProgress,
  'photo-gallery': PhotoGallery,
};

// Loading fallback component
const DemoLoadingFallback: React.FC = () => (
  <div className="demo-loading">
    <div className="demo-loading-spinner" />
    <p>Loading demo...</p>
  </div>
);

// Error boundary for demo components
interface DemoErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DemoErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  DemoErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DemoErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="demo-error">
          <h4>Failed to load demo</h4>
          <p>Component: <code>{this.props.componentName}</code></p>
          <p className="demo-error-message">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main demo renderer component
interface BlogDemoProps {
  componentName: string;
  className?: string;
}

export const BlogDemo: React.FC<BlogDemoProps> = ({ componentName, className }) => {
  const DemoComponent = demoRegistry[componentName];

  if (!DemoComponent) {
    return (
      <div className="demo-not-found">
        <h4>Demo not found</h4>
        <p>Component <code>{componentName}</code> is not registered.</p>
      </div>
    );
  }

  return (
    <DemoErrorBoundary componentName={componentName}>
      <Suspense fallback={<DemoLoadingFallback />}>
        <DemoComponent className={className} />
      </Suspense>
    </DemoErrorBoundary>
  );
};

// Export list of available demos for discovery
export const getAvailableDemos = (): string[] => Object.keys(demoRegistry);

// Check if a demo exists
export const hasDemo = (componentName: string): boolean => componentName in demoRegistry;

export default BlogDemo;
