import type { About } from '../../cms';

interface AboutSectionProps {
  about: About;
}

export default function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Column */}
          <div className="w-full lg:w-1/2 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <p className="text-sm font-medium text-gray-600 font-body">{about.sectionLabel}</p>
            </div>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-dark leading-tight mb-6">
              {about.heading}
            </h2>
            <p className="text-gray-600 font-body leading-relaxed mb-8">
              {about.description}
            </p>
            <a
              href={about.ctaLink}
              className="inline-flex items-center px-8 py-3 bg-orange-500 text-white font-semibold rounded-sm hover:bg-orange-600 transition-all btn-effect font-body"
            >
              <span className="relative z-10">{about.ctaText}</span>
            </a>
          </div>

          {/* Image Column */}
          <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <div className="relative">
              <div className="relative z-5 rounded-lg overflow-hidden">
                <div className="w-full aspect-[4/5] bg-gray-200">
                  <img
                    src={about.aboutImage}
                    alt={`${about.name} at work — UI/UX Designer`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <span class="text-white text-6xl font-heading font-bold">BE</span>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>

              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 w-32 h-32 border-2 border-dashed border-orange-300 rounded-full rotate-360 hidden lg:block" />

              {/* Info Box Overlay */}
              <div className="about-info-box rounded-lg max-w-xs">
                <h3 className="text-white font-heading font-semibold text-lg mb-2">{about.name}</h3>
                <ul className="text-gray-300 text-sm font-body space-y-1">
                  <li>Location: {about.location}</li>
                  <li>Experience: {about.yearsExperience} years</li>
                  <li>Language: {about.language}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
