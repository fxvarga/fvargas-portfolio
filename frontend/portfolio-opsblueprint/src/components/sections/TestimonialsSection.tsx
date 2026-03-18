import Section from '../layout/Section';
import Card from '../ui/Card';

export default function TestimonialsSection() {
  return (
    <Section id="about">
      <div className="text-center mb-12">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          What Our Clients Say
        </h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <svg className="w-10 h-10 text-primary-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
          <blockquote className="text-lg text-gray-700 leading-relaxed italic">
            "OpsBlueprint transformed our lead intake process. What used to take our team
            3 hours of manual work each morning now happens automatically. The AI triage
            alone saved us from losing two major accounts that were sitting in an overflowing inbox."
          </blockquote>
          <div className="mt-6">
            <p className="font-heading font-semibold text-gray-900">Sarah Mitchell</p>
            <p className="text-sm text-gray-500">Operations Director, Horizon Events</p>
          </div>
        </Card>
      </div>
    </Section>
  );
}
