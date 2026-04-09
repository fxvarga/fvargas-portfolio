import type { BlogPost } from '../../cms';

interface BlogSectionProps {
  blogPosts: BlogPost[];
}

export default function BlogSection({ blogPosts }: BlogSectionProps) {
  // If no blog posts, show a placeholder section
  const displayPosts = blogPosts.length > 0 ? blogPosts.slice(0, 3) : [
    {
      title: 'The Art of User-Centered Design',
      slug: 'art-of-user-centered-design',
      excerpt: 'Exploring the principles that guide effective UX design and how they can transform digital products.',
      coverImage: '/images/blog-1.jpg',
      category: 'UX Design',
      date: '2024-06-15',
    },
    {
      title: 'Building Accessible Web Applications',
      slug: 'building-accessible-web-apps',
      excerpt: 'WCAG compliance is more than a checklist. Learn how to create truly inclusive digital experiences.',
      coverImage: '/images/blog-2.jpg',
      category: 'Accessibility',
      date: '2024-05-20',
    },
    {
      title: 'Design Systems That Scale',
      slug: 'design-systems-that-scale',
      excerpt: 'How to build and maintain a design system that grows with your product and team.',
      coverImage: '/images/blog-3.jpg',
      category: 'Design Systems',
      date: '2024-04-10',
    },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="blog" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <p className="text-sm font-medium text-gray-600 font-body">Blog</p>
          </div>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-dark uppercase">
            My Recent Blog
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPosts.map((post, index) => (
            <article key={index} className="group bg-light rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const colors = ['from-orange-400 to-red-400', 'from-blue-400 to-indigo-400', 'from-green-400 to-teal-400'];
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center">
                        <span class="text-white text-4xl font-heading font-bold">${post.category.charAt(0)}</span>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-orange-500 bg-orange-50 px-3 py-1 rounded-full font-body">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400 font-body">{formatDate(post.date)}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-dark mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm font-body leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
