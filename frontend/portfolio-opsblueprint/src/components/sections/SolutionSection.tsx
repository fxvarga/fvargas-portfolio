import Section from '../layout/Section';
import useScrollReveal from '../../hooks/useScrollReveal';

const steps = [
  {
    label: 'Intake',
    description: 'Leads, emails, and customer requests flow into one place automatically.',
    color: 'bg-primary-500',
  },
  {
    label: 'Automation',
    description: 'Smart workflows sort, route, and act on each item — no manual steps.',
    color: 'bg-primary-600',
  },
  {
    label: 'Tracking',
    description: 'You see everything that happened, in real time, from your phone or laptop.',
    color: 'bg-primary-700',
  },
];

export default function SolutionSection() {
  const headerReveal = useScrollReveal();
  const flowReveal = useScrollReveal({ threshold: 0.2 });

  return (
    <Section className="bg-primary-50/50">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          We connect the tools you already use — so they work for you
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          No ripping out what works. We link your email, CRM, spreadsheets, and
          forms into automated pipelines that run 24/7 — even when you're off the clock.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0" ref={flowReveal.ref} style={flowReveal.style}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="text-center">
              <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-md`}>
                <span className="text-white font-heading font-bold text-lg">{i + 1}</span>
              </div>
              <h3 className="font-heading font-semibold text-gray-900 mt-3">
                {step.label}
              </h3>
              <p className="text-gray-600 text-sm mt-1 max-w-[180px] mx-auto">
                {step.description}
              </p>
            </div>
            {i < steps.length - 1 && (
              <svg className="hidden md:block w-16 h-8 text-primary-300 mx-4 flex-shrink-0" viewBox="0 0 64 32" fill="none">
                <path d="M0 16h56M48 8l8 8-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}