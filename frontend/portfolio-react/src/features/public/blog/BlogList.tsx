import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CircularProgress } from '@mui/material';
import { fetchBlogPosts, BlogPost } from '../../../api/blogApi';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import BlogCard from './BlogCard';
import './Blog.css';

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBlogPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
    window.scrollTo(0, 0);
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[];

  // Filter posts by category
  const filteredPosts = selectedCategory
    ? posts.filter(p => p.category === selectedCategory)
    : posts;

  if (isLoading) {
    return (
      <div className="blog-loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Header */}
      <section className="blog-hero">
        <div className="container">
          <div className="blog-hero-content">
            <Link to="/" className="back-link">
              <i className="ti-arrow-left"></i> Back to Portfolio
            </Link>
            <h1>Learning Lab</h1>
            <p className="blog-hero-subtitle">
              Interactive tutorials and deep dives into modern web development.
              Each post includes live demos you can explore.
            </p>
          </div>
        </div>
        <div className="blog-hero-overlay"></div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="blog-filters">
          <div className="container">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="blog-grid-section">
        <div className="container">
          {filteredPosts.length === 0 ? (
            <div className="blog-empty">
              <h3>No posts yet</h3>
              <p>Check back soon for new content!</p>
            </div>
          ) : (
            <div className="blog-grid">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default BlogList;
