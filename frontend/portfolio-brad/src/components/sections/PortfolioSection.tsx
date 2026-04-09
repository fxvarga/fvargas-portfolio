import { useState } from 'react';
import type { Portfolio } from '../../cms';

interface PortfolioSectionProps {
  portfolio: Portfolio;
}

export default function PortfolioSection({ portfolio }: PortfolioSectionProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-light relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <p className="text-sm font-medium text-gray-600 font-body">{portfolio.sectionLabel}</p>
        </div>
        <h2 className="font-heading text-3xl lg:text-4xl font-bold text-dark">
          {portfolio.heading}
        </h2>
      </div>

      {/* Portfolio Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.items.map((item, index) => (
            <div
              key={index}
              className={`portfolio-card rounded-lg ${index % 2 !== 0 ? 'sm:mt-8' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(index)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedItem(index); } }}
            >
              <div className="aspect-[4/5] bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const colors = [
                      'from-blue-400 to-purple-500',
                      'from-green-400 to-teal-500',
                      'from-pink-400 to-rose-500',
                      'from-indigo-400 to-blue-500',
                      'from-amber-400 to-orange-500',
                    ];
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center p-6">
                        <div class="text-center text-white">
                          <div class="text-5xl font-heading font-bold mb-3">${String(index + 1).padStart(2, '0')}</div>
                          <div class="text-sm font-body opacity-80">${item.category}</div>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="portfolio-overlay rounded-lg">
                <div className="text-white">
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-300 font-body mt-1">{item.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedItem !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Portfolio item: ${portfolio.items[selectedItem].title}`}
          onClick={() => setSelectedItem(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSelectedItem(null); }}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
              className="absolute -top-10 right-0 text-white text-2xl hover:text-orange-500 transition-colors"
            >
              &times;
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-200">
                <img
                  src={portfolio.items[selectedItem].image}
                  alt={portfolio.items[selectedItem].title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span class="text-white text-4xl font-heading font-bold">${portfolio.items[selectedItem!].title}</span>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="p-6">
                <span className="text-sm text-orange-500 font-medium font-body">
                  {portfolio.items[selectedItem].category}
                </span>
                <h3 className="font-heading text-2xl font-bold text-dark mt-1">
                  {portfolio.items[selectedItem].title}
                </h3>
                <p className="text-gray-600 font-body mt-3">
                  {portfolio.items[selectedItem].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
