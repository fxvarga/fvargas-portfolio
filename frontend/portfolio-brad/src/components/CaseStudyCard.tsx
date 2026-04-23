import { Link } from 'react-router-dom';
import type { CaseStudy } from '../content/types';
import SmartImage from './SmartImage';
import Editable from './Editable';

interface CaseStudyCardProps {
  study: CaseStudy;
}

export default function CaseStudyCard({ study }: CaseStudyCardProps) {
  const p = `caseStudies.${study.slug}`;

  return (
    <Link
      to={`/work/${study.slug}`}
      className="group block bg-bg-alt rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all hover:shadow-lg"
    >
      <div className="aspect-[16/10] bg-surface/5 overflow-hidden">
        <SmartImage
          src={study.heroImage}
          alt={study.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          placeholderLabel={`${study.category}: ${study.title}`}
        />
      </div>
      <div className="p-6">
        <Editable path={`${p}.category`} as="p" className="text-xs font-medium text-primary font-body uppercase tracking-wider mb-2">
          {study.category}
        </Editable>
        <Editable path={`${p}.title`} as="h3" className="font-heading text-xl font-semibold text-txt group-hover:text-primary transition-colors mb-2">
          {study.title}
        </Editable>
        <Editable path={`${p}.subtitle`} as="p" className="text-sm text-txt-muted font-body leading-relaxed">
          {study.subtitle}
        </Editable>
        <div className="mt-4 flex flex-wrap gap-2">
          {study.tools.slice(0, 3).map((tool, i) => (
            <span key={tool} className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full font-body">
              <Editable path={`${p}.tools.${i}`}>{tool}</Editable>
            </span>
          ))}
          {study.tools.length > 3 && (
            <span className="px-2.5 py-1 text-xs font-medium text-txt-muted font-body">
              +{study.tools.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
