import React from 'react';
import { Link } from 'react-router';
import { BlogPost } from '../../../api/blogApi';

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <article className="blog-card">
      <Link to={`/blog/${post.slug}`} className="blog-card-link">
        {post.featuredImage && (
          <div className="blog-card-image">
            <img src={post.featuredImage.url} alt={post.featuredImage.alt} />
            {post.demoComponent && (
              <span className="blog-card-demo-badge">
                <i className="ti-control-play"></i> Live Demo
              </span>
            )}
          </div>
        )}
        <div className="blog-card-content">
          <div className="blog-card-meta">
            {post.category && <span className="blog-card-category">{post.category}</span>}
            {post.readTime && <span className="blog-card-read-time">{post.readTime}</span>}
          </div>
          <h3 className="blog-card-title">{post.title}</h3>
          <p className="blog-card-excerpt">{post.excerpt}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="blog-card-tags">
              {post.tags.slice(0, 4).map((tag, index) => (
                <span key={index} className="blog-card-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
