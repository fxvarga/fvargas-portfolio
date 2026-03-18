import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge>Workflow Automation Consulting</Badge>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 mt-4 leading-tight">
              Automate Your{' '}
              <span className="text-primary-600">Business Operations</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Stop wasting hours on repetitive tasks. We design and implement custom
              workflow automations that save your team 20+ hours per week.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get a Free Consultation
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>
          </div>

          {/* Placeholder illustration */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-md aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-lg">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="opacity-60">
                <rect x="20" y="30" width="70" height="50" rx="8" fill="#2563EB" opacity="0.3"/>
                <rect x="110" y="30" width="70" height="50" rx="8" fill="#2563EB" opacity="0.3"/>
                <rect x="65" y="110" width="70" height="50" rx="8" fill="#2563EB" opacity="0.5"/>
                <path d="M55 80L80 110" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
                <path d="M145 80L120 110" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="55" cy="55" r="8" fill="#60A5FA"/>
                <circle cx="145" cy="55" r="8" fill="#60A5FA"/>
                <circle cx="100" cy="135" r="8" fill="#2563EB"/>
                <text x="39" y="59" fontSize="10" fill="white" fontWeight="bold">IN</text>
                <text x="131" y="59" fontSize="10" fill="white" fontWeight="bold">AI</text>
                <text x="88" y="139" fontSize="10" fill="white" fontWeight="bold">OUT</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
