import Section from '../layout/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import useScrollReveal from '../../hooks/useScrollReveal';
import type { Services, ServicePackage } from '../../cms';

interface ServicesSectionProps {
  services: Services;
}

function ServiceCard({ service, index, featuredBadgeText }: { service: ServicePackage; index: number; featuredBadgeText: string }) {
  const reveal = useScrollReveal({ threshold: 0.15 });

  // Map badge string to Badge variant
  const badgeVariant = (service.badge || 'gray') as 'gray' | 'blue' | 'green';

  return (
    <div
      ref={reveal.ref}
      style={{
        ...reveal.style,
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <Card
        hover
        className={`flex flex-col h-full ${service.featured ? 'ring-2 ring-primary-500 relative' : ''}`}
      >
        {service.featured && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="blue">{featuredBadgeText}</Badge>
          </div>
        )}
        <Badge variant={badgeVariant}>{service.tier}</Badge>
        <h3 className="font-heading font-bold text-xl text-gray-900 mt-3">
          {service.name}
        </h3>
        <p className="font-heading font-bold text-2xl text-primary-600 mt-2">
          {service.price}
        </p>
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">
          {service.description}
        </p>
        <ul className="mt-4 space-y-2 flex-1">
          {service.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function ServicesSection({ services }: ServicesSectionProps) {
  const headerReveal = useScrollReveal();

  return (
    <Section id="services">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          {services.heading}
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          {services.subheading}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {services.packages.map((service, i) => (
          <ServiceCard key={service.tier} service={service} index={i} featuredBadgeText={services.featuredBadgeText} />
        ))}
      </div>
    </Section>
  );
}
