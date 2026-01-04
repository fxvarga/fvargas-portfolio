// Blog API - Fetches blog posts from GraphQL backend with fallback to mock data
import { gql } from '@apollo/client';
import { getClient } from './apiProvider';

// Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  featuredImage?: {
    url: string;
    alt: string;
  };
  demoComponent?: string;
  mdxFile?: string;
  readTime?: string;
  publishedDate: string;
  isPublished?: boolean;
}

export interface BlogPostRecord {
  id: string;
  entityType: string;
  data: BlogPost;
  version: number;
  publishedAt?: string;
  updatedAt: string;
}

// GraphQL Queries
const GET_BLOG_POSTS = gql`
  query GetBlogPosts {
    blogPosts {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    blogPostBySlug(slug: $slug) {
      id
      entityType
      data
      version
      publishedAt
      updatedAt
    }
  }
`;

// Helper to parse JSON data from GraphQL response
const parseJsonField = <T>(value: T | string): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value;
};

// API Functions
export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_BLOG_POSTS,
      fetchPolicy: 'network-only',
    });
    
    if (!data.blogPosts || data.blogPosts.length === 0) {
      console.log('No blog posts from API, using mock data');
      return mockBlogPosts;
    }

    return data.blogPosts.map((record: BlogPostRecord) => {
      const parsedData = parseJsonField<BlogPost>(record.data);
      return {
        ...parsedData,
        id: record.id  // Override with record ID from GraphQL
      };
    });
  } catch (error) {
    console.warn('Failed to fetch blog posts, using mock data:', error);
    return mockBlogPosts;
  }
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_BLOG_POST_BY_SLUG,
      variables: { slug },
      fetchPolicy: 'network-only',
    });
    
    if (!data.blogPostBySlug) {
      // Fallback to mock data
      const mockPost = mockBlogPosts.find(p => p.slug === slug);
      return mockPost || null;
    }

    const parsedData = parseJsonField<BlogPost>(data.blogPostBySlug.data);
    return {
      ...parsedData,
      id: data.blogPostBySlug.id  // Override with record ID from GraphQL
    };
  } catch (error) {
    console.warn('Failed to fetch blog post, checking mock data:', error);
    const mockPost = mockBlogPosts.find(p => p.slug === slug);
    return mockPost || null;
  }
};

// Mock data for fallback and development
export const mockBlogPosts: BlogPost[] = [
  {
    id: 'mock-1',
    slug: 'dropdown-navigation',
    title: 'Building a Codrops-Style Dropdown Navigation',
    excerpt: 'Learn how to create a smooth, animated dropdown navigation component with React and Framer Motion. This tutorial covers building an accessible, performant navigation system inspired by modern design patterns.',
    category: 'UI/UX',
    tags: ['React', 'Framer Motion', 'Navigation', 'CSS', 'Animation'],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop',
      alt: 'Dropdown Navigation Demo'
    },
    demoComponent: 'dropdown-navigation',
    readTime: '8 min read',
    publishedDate: '2026-01-03',
    isPublished: true
  },
  {
    id: 'mock-2',
    slug: 'animated-page-transitions',
    title: 'Smooth Page Transitions with React Router',
    excerpt: 'Discover how to implement butter-smooth page transitions in your React applications using Framer Motion and React Router. Create seamless navigation experiences that rival native apps.',
    category: 'Animation',
    tags: ['React', 'Framer Motion', 'React Router', 'Transitions'],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
      alt: 'Page Transitions Demo'
    },
    demoComponent: 'page-transitions',
    readTime: '12 min read',
    publishedDate: '2026-01-02',
    isPublished: true
  },
  {
    id: 'mock-3',
    slug: 'css-grid-mastery',
    title: 'CSS Grid Mastery: Building Complex Layouts',
    excerpt: 'Master CSS Grid with practical examples. Learn how to create responsive, complex layouts that adapt beautifully across all screen sizes without media query chaos.',
    category: 'CSS',
    tags: ['CSS', 'Grid', 'Layout', 'Responsive Design'],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
      alt: 'CSS Grid Layout Demo'
    },
    demoComponent: 'css-grid-demo',
    readTime: '10 min read',
    publishedDate: '2026-01-01',
    isPublished: true
  }
];
