import useScrollReveal from '../../hooks/useScrollReveal';
import type { CTA } from '../../cms';

interface CTASectionProps {
  cta: CTA;
}

export default function CTASection({ cta }: CTASectionProps) {
  const reveal = useScrollReveal();

  return (
    <section className="bg-primary-800 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center" ref={reveal.ref} style={reveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
          {cta.heading}
        </h2>
        <p className="mt-4 text-lg text-primary-200 max-w-2xl mx-auto">
          {cta.subheading}
        </p>
        <div className="mt-8">
          <button
            className="font-heading font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center px-8 py-4 text-lg bg-white text-primary-800 hover:bg-primary-100 shadow-lg hover:shadow-xl"
            onClick={() => {
              const target = cta.buttonLink.replace('#', '');
              document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {cta.buttonText}
          </button>
        </div>
      </div>
    </section>
  );
}
