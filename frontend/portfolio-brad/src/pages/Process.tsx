import { Link } from 'react-router-dom';
import { processSteps } from '../content/process';
import SectionHeader from '../components/SectionHeader';
import SmartImage from '../components/SmartImage';
import Editable from '../components/Editable';

export default function Process() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <SectionHeader
            label="Process"
            heading="How I Design"
            subheading="A structured, evidence-driven approach that moves from research through dev-ready handoff. Every step includes real collaboration with PMs and engineers."
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-12">
            {processSteps.map((step) => (
              <div key={step.number} className="relative flex gap-8">
                {/* Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-txt-inverse font-heading font-bold text-lg flex items-center justify-center z-10">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <Editable path={`process.${step.number}.title`} as="h3" className="font-heading text-xl font-bold text-txt mb-2">{step.title}</Editable>
                  <Editable path={`process.${step.number}.description`} as="p" className="text-txt-muted font-body leading-relaxed mb-4">{step.description}</Editable>

                  {/* Artifact placeholder */}
                  {step.artifacts.map((artifact, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-border bg-bg">
                      <div className="aspect-[16/8] bg-surface/5">
                        <SmartImage
                          src={artifact}
                          alt={`${step.title} example artifact`}
                          className="w-full h-full object-cover"
                          placeholderLabel={`Example: ${step.title.toLowerCase()}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-txt-muted font-body mb-6">
            Want to see this process in action?
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/work" className="btn-primary text-sm">
              View Case Studies
            </Link>
            <Link to="/contact" className="btn-outline text-sm">
              Discuss a Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
