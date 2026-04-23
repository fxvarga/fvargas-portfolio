import { Link } from 'react-router-dom';
import { about } from '../content/about';
import { resume } from '../content/resume';
import { skills } from '../content/skills';
import SectionHeader from '../components/SectionHeader';
import SmartImage from '../components/SmartImage';
import Editable from '../components/Editable';

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* About Hero */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionHeader label="About" heading={about.headline} />
              {about.paragraphs.map((p, i) => (
                <Editable key={i} path={`about.paragraphs.${i}`} as="p" className="text-txt-muted font-body leading-relaxed mb-4">{p}</Editable>
              ))}
              <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 italic text-txt font-body text-lg">
                "<Editable path="about.pullQuote">{about.pullQuote}</Editable>"
              </blockquote>
              <div className="flex gap-6 text-sm font-body text-txt-muted">
                <div><span className="text-txt font-medium">Location:</span> <Editable path="about.location">{about.location}</Editable></div>
                <div><span className="text-txt font-medium">Experience:</span> <Editable path="about.yearsExperience">{about.yearsExperience}</Editable> years</div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md aspect-[4/5] bg-surface/5 rounded-lg overflow-hidden border border-border">
                <SmartImage
                  src={about.aboutImage}
                  alt={`${about.name} — UX Designer`}
                  className="w-full h-full object-cover"
                  placeholderLabel="Brad Earnhardt — About Portrait"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="py-12 border-t border-border">
          <SectionHeader label="Skills" heading="Core Competencies" />
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, i) => (
              <span
                key={skill.label}
                className="px-4 py-2 bg-primary/10 text-primary font-medium text-sm font-body rounded-full border border-primary/20"
              >
                <Editable path={`about.skills.${i}.label`}>{skill.label}</Editable>
                {skill.detail && <span className="text-primary/60 ml-1">(<Editable path={`about.skills.${i}.detail`}>{skill.detail}</Editable>)</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div className="py-12 border-t border-border">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader label="Resume" heading="Experience & Education" />
            <a href="/Brad_Earnhardt_Resume.pdf" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex btn-outline text-sm">
              Download Resume
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Experience */}
            <div>
              <h3 className="font-heading text-xl font-semibold text-txt mb-2">Professional Experience</h3>
              <div className="section-divider mb-8" />
              <div className="space-y-6">
                {resume.experience.map((exp, i) => (
                  <div key={i} className="pb-6 border-b border-border last:border-0 last:pb-0">
                    <Editable path={`resume.experience.${i}.dates`} as="p" className="text-sm text-txt-muted font-body mb-1">{exp.dates}</Editable>
                    <Editable path={`resume.experience.${i}.company`} as="h4" className="font-heading text-lg font-semibold text-txt">{exp.company}</Editable>
                    <Editable path={`resume.experience.${i}.role`} as="p" className="text-txt-muted font-body">{exp.role}</Editable>
                    <Editable path={`resume.experience.${i}.location`} as="p" className="text-sm text-txt-muted/60 font-body mt-1">{exp.location}</Editable>
                    {exp.highlights && (
                      <ul className="mt-2 space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-txt-muted font-body">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                            <Editable path={`resume.experience.${i}.highlights.${j}`}>{h}</Editable>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="font-heading text-xl font-semibold text-txt mb-2">Education</h3>
              <div className="section-divider mb-8" />
              {resume.education.map((edu, i) => (
                <div key={i}>
                  <Editable path={`resume.education.${i}.institution`} as="h4" className="font-heading text-lg font-semibold text-txt">{edu.institution}</Editable>
                  <p className="text-txt-muted font-body">
                    <Editable path={`resume.education.${i}.degree`} className="text-txt font-medium">{edu.degree}</Editable> in <Editable path={`resume.education.${i}.field`}>{edu.field}</Editable>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-12 border-t border-border text-center">
          <p className="text-txt-muted font-body mb-6">Interested in working together?</p>
          <Link to="/contact" className="btn-primary">
            Get In Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
