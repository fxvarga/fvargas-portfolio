import Section from '../layout/Section';
import Card from '../ui/Card';
import useScrollReveal from '../../hooks/useScrollReveal';

const testimonials = [
  {
    quote:
      "OpsBlueprint transformed our lead intake process. What used to take our team 3 hours of manual work each morning now happens automatically. The AI triage alone saved us from losing two major accounts that were sitting in an overflowing inbox.",
    name: 'Sarah Mitchell',
    title: 'Operations Director, Horizon Events',
    metric: '3 hrs/day saved',
    photo: '/images/testimonial-1.jpg',
  },
  {
    quote:
      "We were skeptical about automation — we'd tried Zapier on our own and gave up. Fernando mapped out our entire fulfillment workflow in week one, and by week three we had zero manual data entry between our CRM and accounting system. ROI paid for itself in the first month.",
    name: 'Marcus Chen',
    title: 'CEO, Pacific Coast Catering',
    metric: '100% ROI in 30 days',
    photo: '/images/testimonial-2.jpg',
  },
  {
    quote:
      "The proposal generation workflow alone was a game-changer. We used to spend 45 minutes drafting each client proposal manually. Now it's generated automatically from our intake form — branded, accurate, and delivered within seconds.",
    name: 'Elena Rodriguez',
    title: 'VP of Sales, Clearview Property Group',
    metric: '45 min → seconds',
    photo: '/images/testimonial-3.jpg',
  },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[number]; index: number }) {
  const reveal = useScrollReveal({ threshold: 0.15 });

  return (
    <div
      ref={reveal.ref}
      style={{
        ...reveal.style,
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <Card className="h-full flex flex-col">
        {/* Quote icon */}
        <svg className="w-8 h-8 text-primary-200 mb-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>

        {/* Quote text */}
        <blockquote className="text-gray-700 leading-relaxed italic flex-grow">
          "{testimonial.quote}"
        </blockquote>

        {/* Metric badge */}
        <div className="mt-4">
          <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            {testimonial.metric}
          </span>
        </div>

        {/* Author */}
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
          <img
            src={testimonial.photo}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <p className="font-heading font-semibold text-gray-900 text-sm">{testimonial.name}</p>
            <p className="text-xs text-gray-500">{testimonial.title}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TestimonialsSection() {
  const headerReveal = useScrollReveal();

  return (
    <Section id="testimonials">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          What Our Clients Say
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Real results from businesses that automated their operations with OpsBlueprint.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, i) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} index={i} />
        ))}
      </div>
    </Section>
  );
}