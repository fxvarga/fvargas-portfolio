import Section from '../layout/Section';
import useScrollReveal from '../../hooks/useScrollReveal';
import type { HowItWorks, HowItWorksStep } from '../../cms';

// Map iconId from CMS to SVG icons
const iconMap: Record<string, React.ReactNode> = {
  magnifier: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  'pencil-ruler': (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  rocket: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
};

const defaultIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

interface HowItWorksSectionProps {
  howItWorks: HowItWorks;
}

function StepCard({ step, index }: { step: HowItWorksStep; index: number }) {
  const reveal = useScrollReveal({ threshold: 0.2 });

  return (
    <div
      ref={reveal.ref}
      style={{
        ...reveal.style,
        transitionDelay: `${index * 150}ms`,
      }}
      className="text-center"
    >
      <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto">
        {iconMap[step.iconId] || defaultIcon}
      </div>
      <div className="mt-4">
        <span className="text-primary-500 font-heading font-bold text-sm">{step.number}</span>
        <h3 className="font-heading font-bold text-xl text-gray-900 mt-1">
          {step.title}
        </h3>
        <p className="text-gray-600 mt-2 leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export default function HowItWorksSection({ howItWorks }: HowItWorksSectionProps) {
  const headerReveal = useScrollReveal();

  return (
    <Section id="how-it-works" className="bg-gray-50">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          {howItWorks.heading}
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          {howItWorks.subheading}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {howItWorks.steps.map((step, i) => (
          <StepCard key={step.number} step={step} index={i} />
        ))}
      </div>
    </Section>
  );
}
