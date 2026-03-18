import Section from '../layout/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const services = [
  {
    tier: 'Starter',
    name: 'Workflow Audit',
    price: '$500 - $1,500',
    description: 'We map your current processes, identify bottlenecks, and deliver a prioritized automation roadmap.',
    features: [
      'Process mapping & documentation',
      'Bottleneck identification',
      'Tool & integration assessment',
      'Prioritized automation roadmap',
      'ROI projections',
    ],
    badge: 'gray' as const,
  },
  {
    tier: 'Professional',
    name: 'Core Automation',
    price: '$5,000 - $15,000',
    description: 'We build and deploy the core workflow automations your business needs to save 20+ hours per week.',
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
    tier: 'Enterprise',
    name: 'Advanced Systems',
    price: '$15,000 - $40,000',
    description: 'Full-scale operational automation with AI-powered decision making and custom dashboards.',
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

export default function ServicesSection() {
  return (
    <Section id="services">
      <div className="text-center mb-12">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          Services & Pricing
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the engagement level that fits your business. Every project starts
          with understanding your unique workflow challenges.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card
            key={service.tier}
            hover
            className={`flex flex-col ${service.featured ? 'ring-2 ring-primary-500 relative' : ''}`}
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
        ))}
      </div>
    </Section>
  );
}
