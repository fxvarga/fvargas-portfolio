import Button from '../ui/Button';
import Badge from '../ui/Badge';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function HeroSection() {
  const reveal = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center" ref={reveal.ref} style={reveal.style}>
          <div>
            <Badge>Workflow Automation Consulting</Badge>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 mt-4 leading-tight">
              Cut 20+ Hours of{' '}
              <span className="text-primary-600">Manual Work</span>{' '}
              Every Week
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Your team spends hours on data entry, email routing, and report generation
              that software should handle. We design and implement custom automations
              that eliminate repetitive tasks — so you can focus on growth.
            </p>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>No-code & AI-powered</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Live in weeks, not months</span>
              </div>
            </div>
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

          {/* Hero image */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <img
                src="/images/hero-workspace.jpg"
                alt="Team collaborating on workflow automation in a modern office"
                className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                loading="eager"
              />
              {/* Floating stat card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">20+ hrs saved</p>
                    <p className="text-xs text-gray-500">per week, per client</p>
                  </div>
                </div>
              </div>
              {/* Floating automation badge */}
              <div className="absolute -top-3 -right-3 bg-primary-600 text-white rounded-lg shadow-lg px-4 py-2 text-sm font-semibold">
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}