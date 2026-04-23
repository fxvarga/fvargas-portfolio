import { useParams, Navigate } from 'react-router-dom';
import { getCaseStudyBySlug } from '../content/caseStudies';
import CaseStudyRenderer from '../components/CaseStudyRenderer';

export default function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  if (!study) {
    return <Navigate to="/work" replace />;
  }

  return <CaseStudyRenderer study={study} />;
}
