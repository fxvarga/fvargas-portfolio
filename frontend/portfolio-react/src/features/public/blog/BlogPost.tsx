import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { CircularProgress } from '@mui/material';
import { BlogPost as BlogPostType, fetchBlogPostBySlug } from '../../../api/blogApi';
import { BlogDemo, hasDemo } from '../../../blog-components';
import { MarkdownRenderer } from '../../../shared/components/MarkdownRenderer';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import './Blog.css';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Fetch the blog post metadata
  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await fetchBlogPostBySlug(slug);
        setPost(data);
      } catch (error) {
        console.error('Failed to load blog post:', error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch the markdown content if available
  useEffect(() => {
    const loadMarkdownContent = async () => {
      if (!post?.mdxFile && !slug) return;
      
      // Try to load markdown from the public/content/blog folder
      const contentPath = post?.mdxFile || `/content/blog/${slug}.md`;
      setIsLoadingContent(true);
      
      try {
        const response = await fetch(contentPath);
        if (response.ok) {
          const content = await response.text();
          setMarkdownContent(content);
        } else {
          setMarkdownContent(null);
        }
      } catch (error) {
        console.error('Failed to load markdown content:', error);
        setMarkdownContent(null);
      } finally {
        setIsLoadingContent(false);
      }
    };
    
    if (post || slug) {
      loadMarkdownContent();
    }
  }, [post, slug]);

  if (isLoading) {
    return (
      <div className="blog-loading">
        <CircularProgress />
      </div>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="blog-not-found">
          <div className="container">
            <h2>Post Not Found</h2>
            <p>The requested blog post could not be found.</p>
            <button onClick={() => navigate('/blog')} className="theme-btn">
              Back to Blog
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Header */}
      <section className="blog-post-hero">
        <div className="container">
          <div className="blog-post-hero-content">
            <Link to="/blog" className="back-link">
              <i className="ti-arrow-left"></i> Back to Learning Lab
            </Link>
            <div className="blog-post-meta">
              {post.category && <span className="blog-post-category">{post.category}</span>}
              <span className="blog-post-date">{post.publishedDate}</span>
              {post.readTime && <span className="blog-post-read-time">{post.readTime}</span>}
            </div>
            <h1>{post.title}</h1>
            <p className="blog-post-excerpt">{post.excerpt}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="blog-post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="blog-post-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="blog-post-hero-overlay"></div>
      </section>

      {/* Demo Section */}
      {post.demoComponent && (
        <section className="blog-post-demo">
          <div className="container">
            <div className="demo-container">
              <div className="demo-header">
                <h3>
                  <i className="ti-control-play"></i> Interactive Demo
                </h3>
                <p>Explore the live implementation below</p>
              </div>
              <div className="demo-content">
                {hasDemo(post.demoComponent) ? (
                  <BlogDemo componentName={post.demoComponent} />
                ) : (
                  <div className="demo-placeholder">
                    <div className="demo-placeholder-content">
                      <i className="ti-layout-grid3"></i>
                      <p>Demo component: <code>{post.demoComponent}</code></p>
                      <span className="demo-coming-soon">Demo component not yet available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section - Rendered from Markdown */}
      <section className="blog-post-content">
        <div className="container">
          <div className="blog-post-body">
            {isLoadingContent ? (
              <div className="content-loading">
                <CircularProgress size={24} />
                <span>Loading content...</span>
              </div>
            ) : markdownContent ? (
              <MarkdownRenderer content={markdownContent} />
            ) : (
              <div className="content-placeholder">
                <h2>Tutorial Content</h2>
                <p>
                  This tutorial content will be available soon. In the meantime,
                  explore the interactive demo above to see the component in action.
                </p>
                <ul>
                  <li>Step-by-step instructions with code examples</li>
                  <li>Interactive code blocks with syntax highlighting</li>
                  <li>Embedded mini-demos throughout the tutorial</li>
                  <li>Links to related resources and documentation</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="blog-post-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Found this helpful?</h2>
            <p>Check out more tutorials in the Learning Lab</p>
            <Link to="/blog" className="theme-btn">
              Browse All Posts
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default BlogPost;
