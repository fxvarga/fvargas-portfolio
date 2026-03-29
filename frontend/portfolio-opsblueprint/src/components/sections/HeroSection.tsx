import Button from '../ui/Button';
import Badge from '../ui/Badge';
import useScrollReveal from '../../hooks/useScrollReveal';
import type { Hero } from '../../cms';

interface HeroSectionProps {
  hero: Hero;
}

export default function HeroSection({ hero }: HeroSectionProps) {
  const reveal = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center" ref={reveal.ref} style={reveal.style}>
          <div>
            <Badge>{hero.badgeText}</Badge>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 mt-4 leading-tight">
              {hero.headingLine1}{' '}
              <span className="text-primary-600">{hero.headingHighlight}</span>{' '}
              {hero.headingLine2}
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              {hero.subheading}
            </p>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
              {hero.trustIndicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{indicator.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => {
                  const target = hero.primaryCtaLink.replace('#', '');
                  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {hero.primaryCtaText}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const target = hero.secondaryCtaLink.replace('#', '');
                  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {hero.secondaryCtaText}
              </Button>
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <img
                src={hero.heroImage.src}
                alt={hero.heroImage.alt}
                className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                loading="eager"
              />
              {/* Floating stat card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{hero.floatingStatValue}</p>
                    <p className="text-xs text-gray-500">{hero.floatingStatDescription}</p>
                  </div>
                </div>
              </div>
              {/* Floating automation badge */}
              <div className="absolute -top-3 -right-3 bg-primary-600 text-white rounded-lg shadow-lg px-4 py-2 text-sm font-semibold">
                {hero.floatingBadgeText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
