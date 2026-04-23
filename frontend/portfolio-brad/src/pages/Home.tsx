import { Link } from 'react-router-dom';
import { hero } from '../content/hero';
import { skills, howIWork, tools } from '../content/skills';
import { featuredCaseStudies } from '../content/caseStudies';
import CaseStudyCard from '../components/CaseStudyCard';
import SectionHeader from '../components/SectionHeader';
import SmartImage from '../components/SmartImage';
import Editable from '../components/Editable';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-bg min-h-[85vh] pt-24 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Image */}
            <div className="w-full lg:w-5/12 flex justify-center lg:justify-end order-1">
              <div className="relative">
                <div className="w-72 h-96 sm:w-80 sm:h-[28rem] lg:w-96 lg:h-[32rem] bg-surface/5 rounded-lg overflow-hidden border border-border">
                  <SmartImage
                    src={hero.heroImage}
                    alt="Brad Earnhardt, UX Designer"
                    className="w-full h-full object-cover"
                    loading="eager"
                    placeholderLabel="Brad Earnhardt — Hero Portrait"
                  />
                </div>
                <div className="absolute -top-3 -right-3 lg:-right-6 px-4 py-2 bg-primary text-txt-inverse text-xs font-bold font-body rounded-full">
                  <Editable path="hero.badgeText">{hero.badgeText}</Editable>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="w-full lg:w-7/12 order-2 text-center lg:text-left">
              <Editable path="hero.greeting" as="p" className="text-sm uppercase tracking-widest text-txt-muted font-body mb-4">
                {hero.greeting}
              </Editable>
              <Editable path="hero.headline" as="h1" className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-txt leading-tight mb-6">
                {hero.headline}
              </Editable>
              <Editable path="hero.subheadline" as="p" className="text-lg text-txt-muted font-body leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                {hero.subheadline}
              </Editable>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to={hero.ctaLink} className="btn-primary">
                  <Editable path="hero.ctaText">{hero.ctaText}</Editable>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/process" className="btn-outline">
                  My Process
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section className="py-20 lg:py-28 bg-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader label="Featured Work" heading="Selected Case Studies" />
            <Link to="/work" className="hidden sm:inline-flex btn-outline text-sm">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCaseStudies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/work" className="btn-outline text-sm">View All Work</Link>
          </div>
        </div>
      </section>

      {/* How I Work */}
      <section className="py-20 lg:py-28 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <SectionHeader label="Approach" heading="How I Work" />
              <ul className="space-y-4">
                {howIWork.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-txt-muted">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <Editable path={`howIWork.${i}`}>{item}</Editable>
                  </li>
                ))}
              </ul>
              <Link to="/process" className="btn-primary mt-8 text-sm">
                See Full Process
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div>
              <SectionHeader label="Skills" heading="Core Competencies" />
              <div className="flex flex-wrap gap-3 mb-10">
                {skills.map((skill, i) => (
                  <span
                    key={skill.label}
                    className="px-4 py-2 bg-primary/10 text-primary font-medium text-sm font-body rounded-full border border-primary/20"
                  >
                    <Editable path={`skills.${i}.label`}>{skill.label}</Editable>
                    {skill.detail && <span className="text-primary/60 ml-1">(<Editable path={`skills.${i}.detail`}>{skill.detail}</Editable>)</span>}
                  </span>
                ))}
              </div>

              <h4 className="font-heading text-lg font-semibold text-txt mb-4">Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((tool, i) => (
                  <div key={tool.name} className="flex items-center gap-2 text-sm font-body text-txt-muted py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <Editable path={`tools.${i}.name`}>{tool.name}</Editable>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
