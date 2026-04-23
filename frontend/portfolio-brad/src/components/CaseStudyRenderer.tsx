import { Link } from 'react-router-dom';
import type { CaseStudy, Artifact } from '../content/types';
import SmartImage from './SmartImage';
import Editable from './Editable';

interface CaseStudyRendererProps {
  study: CaseStudy;
}

function ArtifactGrid({ artifacts, title, pathPrefix }: { artifacts: Artifact[]; title: string; pathPrefix: string }) {
  if (artifacts.length === 0) return null;
  return (
    <div className="mb-10">
      <h4 className="font-heading text-lg font-semibold text-txt mb-4">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {artifacts.map((a, i) => (
          <figure key={i} className="bg-bg rounded-lg overflow-hidden border border-border">
            <div className="aspect-[16/10] bg-surface/5">
              <SmartImage
                src={a.image}
                alt={a.caption}
                className="w-full h-full object-cover"
                placeholderLabel={a.caption}
              />
            </div>
            <figcaption className="px-4 py-3 text-sm text-txt-muted font-body">
              <Editable path={`${pathPrefix}.${i}.caption`}>{a.caption}</Editable>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function CaseStudyRenderer({ study }: CaseStudyRendererProps) {
  /** Prefix for all editable paths in this case study */
  const p = `caseStudies.${study.slug}`;

  return (
    <article className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <div className="bg-surface text-txt-inverse">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link to="/work" className="inline-flex items-center gap-2 text-sm text-txt-inverse/70 hover:text-txt-inverse font-body mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Work
          </Link>
          <Editable path={`${p}.category`} as="p" className="text-sm font-medium text-primary uppercase tracking-wider mb-3 font-body">{study.category}</Editable>
          <Editable path={`${p}.title`} as="h1" className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">{study.title}</Editable>
          <Editable path={`${p}.subtitle`} as="p" className="text-lg text-txt-inverse/80 font-body max-w-2xl mb-8">{study.subtitle}</Editable>
          <div className="flex flex-wrap gap-6 text-sm text-txt-inverse/70 font-body">
            <div><span className="text-txt-inverse font-medium">Role:</span> <Editable path={`${p}.role`}>{study.role}</Editable></div>
            <div><span className="text-txt-inverse font-medium">Company:</span> <Editable path={`${p}.company`}>{study.company}</Editable></div>
            <div><span className="text-txt-inverse font-medium">Timeline:</span> <Editable path={`${p}.timeline`}>{study.timeline}</Editable></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {study.tools.map((tool, i) => (
              <span key={tool} className="px-3 py-1 text-xs font-medium bg-white/10 rounded-full">
                <Editable path={`${p}.tools.${i}`}>{tool}</Editable>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="rounded-lg overflow-hidden shadow-xl border border-border">
          <div className="aspect-[16/9] bg-surface/5">
            <SmartImage
              src={study.heroImage}
              alt={`${study.title} — hero`}
              className="w-full h-full object-cover"
              loading="eager"
              placeholderLabel={`${study.title} — hero screenshot`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {/* Problem */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">The Problem</h2>
          <div className="section-divider mb-6" />
          <Editable path={`${p}.problem`} as="p" className="text-txt-muted font-body leading-relaxed text-lg">{study.problem}</Editable>
        </section>

        {/* Constraints */}
        <section className="mb-14">
          <h3 className="font-heading text-xl font-semibold text-txt mb-4">Constraints</h3>
          <ul className="space-y-2">
            {study.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-txt-muted font-body">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <Editable path={`${p}.constraints.${i}`}>{c}</Editable>
              </li>
            ))}
          </ul>
        </section>

        {/* Research */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">Research</h2>
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-heading text-lg font-semibold text-txt mb-3">Methods</h4>
              <ul className="space-y-2">
                {study.research.methods.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-txt-muted font-body text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <Editable path={`${p}.research.methods.${i}`}>{m}</Editable>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg font-semibold text-txt mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {study.research.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-3 text-txt-muted font-body text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <Editable path={`${p}.research.insights.${i}`}>{ins}</Editable>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">Process</h2>
          <div className="section-divider mb-6" />
          <ArtifactGrid artifacts={study.process.flows} title="User Flows" pathPrefix={`${p}.process.flows`} />
          <ArtifactGrid artifacts={study.process.wireframes} title="Wireframes" pathPrefix={`${p}.process.wireframes`} />
          <ArtifactGrid artifacts={study.process.iterations} title="Iterations" pathPrefix={`${p}.process.iterations`} />
        </section>

        {/* Design */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">Final Design</h2>
          <div className="section-divider mb-6" />
          <ArtifactGrid artifacts={study.design.screens} title="Key Screens" pathPrefix={`${p}.design.screens`} />
          <div className="bg-bg rounded-lg p-6 border border-border">
            <h4 className="font-heading text-sm font-semibold text-txt mb-2 uppercase tracking-wider">Design System</h4>
            <Editable path={`${p}.design.systemNotes`} as="p" className="text-txt-muted font-body text-sm">{study.design.systemNotes}</Editable>
          </div>
        </section>

        {/* Collaboration */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">Collaboration</h2>
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {study.collaboration.partners.map((partner, i) => (
              <div key={i} className="bg-bg rounded-lg p-4 border border-border">
                <Editable path={`${p}.collaboration.partners.${i}`} as="p" className="text-sm text-txt font-body">{partner}</Editable>
              </div>
            ))}
          </div>
          <Editable path={`${p}.collaboration.handoffNotes`} as="p" className="text-txt-muted font-body text-sm">{study.collaboration.handoffNotes}</Editable>
        </section>

        {/* Outcome */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-txt mb-4">Outcome</h2>
          <div className="section-divider mb-6" />
          <ul className="space-y-3 mb-6">
            {study.outcome.metrics.map((m, i) => (
              <li key={i} className="flex items-start gap-3 font-body">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <Editable path={`${p}.outcome.metrics.${i}`} className="text-txt">{m}</Editable>
              </li>
            ))}
          </ul>
          {study.outcome.quote && (
            <blockquote className="border-l-4 border-primary pl-6 py-2 italic text-txt-muted font-body text-lg">
              "<Editable path={`${p}.outcome.quote`}>{study.outcome.quote}</Editable>"
            </blockquote>
          )}
        </section>

        {/* Nav */}
        <div className="border-t border-border pt-8 flex justify-between">
          <Link to="/work" className="btn-outline text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All Work
          </Link>
          <Link to="/contact" className="btn-primary text-sm">
            Discuss a Project
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
