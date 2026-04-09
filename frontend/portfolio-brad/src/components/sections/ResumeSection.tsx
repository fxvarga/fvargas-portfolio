import type { Resume } from '../../cms';

interface ResumeSectionProps {
  resume: Resume;
}

export default function ResumeSection({ resume }: ResumeSectionProps) {
  return (
    <section id="resume" className="py-20 lg:py-28 bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <p className="text-sm font-medium text-gray-600 font-body">{resume.sectionLabel}</p>
          </div>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-dark uppercase">
            {resume.heading}
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Education Column */}
          <div>
            <h3 className="font-heading text-xl font-medium text-dark mb-4">Education</h3>
            <div className="section-divider mb-8" />

            <div className="space-y-8">
              {resume.education.map((edu, index) => (
                <div key={index} className="group">
                  <h4 className="font-heading text-lg font-semibold text-dark mb-1">
                    {edu.institution}
                  </h4>
                  <p className="text-gray-600 font-body">
                    <span className="text-dark font-medium">{edu.degree}</span> in {edu.field}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Column */}
          <div>
            <h3 className="font-heading text-xl font-medium text-dark mb-4">Professional Experience</h3>
            <div className="section-divider mb-8" />

            <div className="space-y-6">
              {resume.experience.map((exp, index) => (
                <div key={index} className="group pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                  <p className="text-sm text-gray-500 font-body mb-1">{exp.dates}</p>
                  <h4 className="font-heading text-lg font-semibold text-dark mb-1">
                    {exp.company}
                  </h4>
                  <p className="text-gray-600 font-body">{exp.role}</p>
                  {exp.location && (
                    <p className="text-sm text-gray-400 font-body mt-1">{exp.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
