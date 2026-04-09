import { useState } from 'react';
import type { Services } from '../../cms';

interface ServicesSectionProps {
  services: Services;
}

export default function ServicesSection({ services }: ServicesSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="services" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <p className="text-sm font-medium text-gray-600 font-body">{services.sectionLabel}</p>
          </div>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-dark uppercase">
            {services.heading}
          </h2>
        </div>

        {/* Services Layout */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Image/Visual Column */}
          <div className="w-full lg:w-5/12">
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] bg-gradient-to-br from-orange-400 to-orange-600">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="text-7xl font-heading font-bold mb-4">
                  {services.items[activeIndex]?.number || '1'}
                </div>
                <h3 className="text-2xl font-heading font-semibold mb-3">
                  {services.items[activeIndex]?.title}
                </h3>
                <p className="text-white/80 font-body text-sm leading-relaxed max-w-xs">
                  {services.items[activeIndex]?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Services List Column */}
          <div className="w-full lg:w-7/12 space-y-0">
            {services.items.map((service, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all duration-300 border-b border-gray-200 ${
                  index === activeIndex ? 'py-8' : 'py-6'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveIndex(index); } }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <h4
                      className={`font-heading text-2xl lg:text-3xl uppercase transition-all duration-300 ${
                        index === activeIndex
                          ? 'text-orange-500 font-bold'
                          : 'stroke-text font-bold'
                      }`}
                    >
                      {service.title}
                    </h4>
                    <span className="font-heading text-xl font-semibold text-dark">{service.number}</span>
                  </div>
                </div>

                {/* Expanded description on active */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    index === activeIndex ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-gray-600 font-body leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
