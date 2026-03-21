import Section from '../layout/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import useScrollReveal from '../../hooks/useScrollReveal';

const services = [
  {
    tier: 'Starter',
    name: 'Workflow Audit',
    price: '$500 - $1,500',
    description: 'We map how your business actually runs today, find the time-wasters, and hand you a clear plan for what to automate first.',
    features: [
      'Process mapping & documentation',
      'Bottleneck identification',
      'Tool & integration assessment',
      'Prioritized automation roadmap',
      'ROI projections for your budget',
    ],
    badge: 'gray' as const,
  },
  {
    tier: 'Professional',
    name: 'Core Automation',
    price: '$5,000 - $15,000',
    description: 'We build the automations that give you your time back — lead follow-ups, invoicing, data syncing — so you can focus on customers.',
    features: [
      'Everything in Workflow Audit',
      'Custom n8n/Zapier workflows',
      'CRM & email integration',
      'Lead intake automation',
      'Proposal generation pipeline',
      '30-day post-launch support',
    ],
    badge: 'blue' as const,
    featured: true,
  },
  {
    tier: 'Growth',
    name: 'Advanced Systems',
    price: '$15,000 - $40,000',
    description: 'For growing businesses ready to scale operations — AI-powered triage, multi-step approvals, and dashboards that keep you in control.',
    features: [
      'Everything in Core Automation',
      'AI-powered email triage',
      'Multi-step approval workflows',
      'Custom reporting dashboards',
      'API integrations & webhooks',
      'Dedicated support & training',
    ],
    badge: 'green' as const,
  },
];

function ServiceCard({ service, index }: { service: typeof services[number]; index: number }) {
  const reveal = useScrollReveal({ threshold: 0.15 });

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
            <Badge variant="blue">Most Popular</Badge>
          </div>
        )}
        <Badge variant={service.badge}>{service.tier}</Badge>
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

export default function ServicesSection() {
  const headerReveal = useScrollReveal();

  return (
    <Section id="services">
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          Packages That Fit a Small Business Budget
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Every dollar counts when you're growing. Pick the level that makes sense
          for where you are — each one pays for itself in time saved.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <ServiceCard key={service.tier} service={service} index={i} />
        ))}
      </div>
    </Section>
  );
}