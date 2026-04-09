import type { Hero } from '../../cms';

interface HeroSectionProps {
  hero: Hero;
}

export default function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section id="home" className="relative bg-light min-h-screen pt-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-12 lg:py-0">
          {/* Image Column */}
          <div className="relative w-full lg:w-5/12 flex justify-center lg:justify-end order-1 lg:order-1">
            <div className="relative">
              <div className="w-72 h-96 sm:w-80 sm:h-[28rem] lg:w-96 lg:h-[32rem] bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={hero.heroImage}
                   alt="Professional portrait of Brad Earnhardt, Senior UI/UX Designer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span class="text-white text-8xl font-heading font-bold">BE</span>
                      </div>
                    `;
                  }}
                />
              </div>
              {/* Rotating Badge */}
              <div className="absolute -top-4 -right-4 lg:-right-8 w-24 h-24 lg:w-28 lg:h-28">
                <div className="rotate-360 w-full h-full rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-center p-2">
                    <span className="text-xs font-bold font-heading leading-tight">{hero.badgeText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Column */}
          <div className="w-full lg:w-7/12 order-2 lg:order-2 text-center lg:text-left">
            <p className="text-sm uppercase tracking-widest text-gray-500 font-body mb-4">
              {hero.greeting}
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold text-dark leading-tight mb-8">
              {hero.heading}
            </h1>
            <div className="lg:ml-24 lg:pl-4">
              <p className="text-base lg:text-lg text-gray-600 font-body leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                {hero.description}
              </p>
              <a
                href={hero.ctaLink}
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-orange-500 text-white font-semibold rounded-sm hover:bg-orange-600 transition-all btn-effect font-body"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {hero.ctaText}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
