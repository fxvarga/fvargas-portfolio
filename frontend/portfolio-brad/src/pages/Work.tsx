import { caseStudies } from '../content/caseStudies';
import CaseStudyCard from '../components/CaseStudyCard';
import SectionHeader from '../components/SectionHeader';

export default function Work() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <SectionHeader
            label="Work"
            heading="Case Studies"
            subheading="Detailed walkthroughs of real projects — from research and wireframes through final design and outcome."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </div>
    </div>
  );
}
