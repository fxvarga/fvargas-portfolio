/**
 * Markdown/MDX Renderer Component
 * 
 * Renders markdown content with syntax highlighting, custom components,
 * and GitHub-flavored markdown support.
 */

import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Import Prism language support
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-graphql';

import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom code block component with syntax highlighting
const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ inline, className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (!inline && language) {
      Prism.highlightAll();
    }
  }, [inline, language, codeString]);

  if (inline) {
    return <code className="inline-code">{children}</code>;
  }

  return (
    <div className="code-block-wrapper">
      {language && (
        <div className="code-block-header">
          <span className="code-language">{language}</span>
          <button
            className="copy-button"
            onClick={() => navigator.clipboard.writeText(codeString)}
            title="Copy code"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      )}
      <pre className={`language-${language}`}>
        <code className={`language-${language}`}>{codeString}</code>
      </pre>
    </div>
  );
};

// Custom link component that opens external links in new tab
const CustomLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...props }) => {
  const isExternal = href?.startsWith('http') || href?.startsWith('//');
  
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
      {isExternal && (
        <svg className="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      )}
    </a>
  );
};

// Custom image component with lazy loading
const CustomImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ src, alt, ...props }) => {
  return (
    <figure className="markdown-figure">
      <img src={src} alt={alt} loading="lazy" {...props} />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  );
};

// Custom blockquote component
const CustomBlockquote: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <blockquote className="markdown-blockquote">
      <div className="blockquote-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"/>
        </svg>
      </div>
      <div className="blockquote-content">{children}</div>
    </blockquote>
  );
};

// Callout/Admonition component for special blocks
const CalloutPattern = /^(note|tip|warning|danger|info):\s*/i;

const Callout: React.FC<{ type: string; children: React.ReactNode }> = ({ type, children }) => {
  const icons: Record<string, JSX.Element> = {
    note: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    tip: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    danger: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  };

  return (
    <div className={`callout callout-${type.toLowerCase()}`}>
      <div className="callout-icon">{icons[type.toLowerCase()] || icons.info}</div>
      <div className="callout-content">{children}</div>
    </div>
  );
};

// Custom paragraph that detects callouts
const CustomParagraph: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (typeof children === 'string') {
    const match = CalloutPattern.exec(children);
    if (match) {
      const type = match[1];
      const content = children.replace(CalloutPattern, '');
      return <Callout type={type}>{content}</Callout>;
    }
  }
  
  // Check if first child is a string with callout pattern
  if (Array.isArray(children) && typeof children[0] === 'string') {
    const match = CalloutPattern.exec(children[0]);
    if (match) {
      const type = match[1];
      const newChildren = [...children];
      newChildren[0] = children[0].replace(CalloutPattern, '');
      return <Callout type={type}>{newChildren}</Callout>;
    }
  }

  return <p>{children}</p>;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  useEffect(() => {
    // Highlight code blocks after render
    Prism.highlightAll();
  }, [content]);

  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock as any,
          a: CustomLink as any,
          img: CustomImage as any,
          blockquote: CustomBlockquote as any,
          p: CustomParagraph,
          // Add custom heading with anchor links
          h1: ({ children }) => <h1 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h1>,
          h2: ({ children }) => <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h2>,
          h3: ({ children }) => <h3 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h3>,
          // Custom table styling
          table: ({ children }) => (
            <div className="table-wrapper">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
