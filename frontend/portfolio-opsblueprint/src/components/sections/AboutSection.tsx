import Section from '../layout/Section';
import useScrollReveal from '../../hooks/useScrollReveal';

const highlights = [
  { label: '12+ Years', description: 'Full-stack engineering experience' },
  { label: 'Finance & Healthcare', description: 'Enterprise-grade domain expertise' },
  { label: 'AI + Automation', description: 'Modern workflow orchestration' },
];

export default function AboutSection() {
  const reveal = useScrollReveal();
  const statsReveal = useScrollReveal({ threshold: 0.2 });

  return (
    <Section id="about">
      <div ref={reveal.ref} style={reveal.style}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wide mb-2">
              About the Founder
            </p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
              Built by an engineer who's automated operations across industries
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              I'm Fernando Vargas, a Senior Full-Stack Engineer with 12+ years of experience
              building systems for finance, healthcare, and content-driven businesses.
              I've seen firsthand how much time teams waste on tasks that software should handle.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              OpsBlueprint is the result of years spent designing AI workflow orchestration,
              financial dashboard applications, CMS platforms, and search systems.
              I combine deep technical expertise with a practical understanding of business
              operations to deliver automations that actually work.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://www.linkedin.com/in/fernando-vargas-16234254/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="https://fernando-vargas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Portfolio
              </a>
            </div>
          </div>

          {/* Stats / credentials card */}
          <div ref={statsReveal.ref} style={statsReveal.style}>
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-heading font-bold">
                  FV
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl">Fernando Vargas</h3>
                  <p className="text-primary-200 text-sm">Senior Full-Stack Engineer</p>
                </div>
              </div>

              <div className="space-y-4">
                {highlights.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-primary-200 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-primary-200 text-sm leading-relaxed">
                  "I built OpsBlueprint because I kept seeing the same problem: talented teams
                  drowning in manual processes that a well-designed automation could eliminate in days."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}