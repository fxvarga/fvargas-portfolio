import Section from '../layout/Section';
import Card from '../ui/Card';
import useScrollReveal from '../../hooks/useScrollReveal';
import type { Testimonials, TestimonialItem } from '../../cms';

interface TestimonialsSectionProps {
  testimonials: Testimonials;
}

function TestimonialCard({ testimonial, index }: { testimonial: TestimonialItem; index: number }) {
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

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const headerReveal = useScrollReveal();

  return (
    <Section id="testimonials">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          {testimonials.heading}
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          {testimonials.subheading}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.testimonials.map((testimonial, i) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} index={i} />
        ))}
      </div>
    </Section>
  );
}
