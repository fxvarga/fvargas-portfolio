import Button from '../ui/Button';

export default function CTASection() {
  return (
    <section className="bg-primary-800 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
          Ready to streamline your operations?
        </h2>
        <p className="mt-4 text-lg text-primary-200 max-w-2xl mx-auto">
          Join dozens of businesses that have reclaimed 20+ hours per week
          by automating their manual workflows.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg"
            onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Your Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
}
