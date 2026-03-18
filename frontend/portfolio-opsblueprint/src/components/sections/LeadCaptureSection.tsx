import { useState, FormEvent } from 'react';
import Section from '../layout/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

const industries = [
  { value: 'catering', label: 'Catering & Food Service' },
  { value: 'events', label: 'Event Planning & Management' },
  { value: 'accounting', label: 'Accounting & Finance' },
  { value: 'property', label: 'Property Management' },
  { value: 'healthcare', label: 'Healthcare Services' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'retail', label: 'Retail & E-Commerce' },
  { value: 'construction', label: 'Construction & Trades' },
  { value: 'other', label: 'Other' },
];

interface FormData {
  fullName: string;
  email: string;
  company: string;
  industry: string;
  problemDescription: string;
}

export default function LeadCaptureSection() {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    company: '',
    industry: '',
    problemDescription: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: window.location.hostname,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setForm({ fullName: '', email: '', company: '', industry: '', problemDescription: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <Section id="lead-form" className="bg-primary-50">
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Thank you!</h2>
          <p className="mt-2 text-gray-600">
            We've received your request and will reach out within 24 hours to discuss
            how we can help automate your operations.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="lead-form" className="bg-primary-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
            Let's Talk About Your Workflow
          </h2>
          <p className="mt-4 text-gray-600">
            Tell us about your biggest operational challenge. We'll respond with a
            custom analysis within 24 hours — no obligation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="fullName"
              label="Full Name"
              placeholder="Jane Smith"
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="jane@company.com"
              required
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="company"
              label="Company"
              placeholder="Acme Corp"
              value={form.company}
              onChange={handleChange('company')}
            />
            <Select
              id="industry"
              label="Industry"
              options={industries}
              value={form.industry}
              onChange={handleChange('industry')}
            />
          </div>

          <Textarea
            id="problemDescription"
            label="What's your biggest operational challenge?"
            placeholder="e.g., We spend 3 hours every morning manually entering lead data from email into our CRM..."
            value={form.problemDescription}
            onChange={handleChange('problemDescription')}
          />

          {status === 'error' && (
            <p className="text-red-600 text-sm">{errorMsg}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting...' : 'Get Your Free Consultation'}
          </Button>

          <p className="text-center text-xs text-gray-500">
            No spam. No obligation. We'll review your challenge and respond within 24 hours.
          </p>
        </form>
      </div>
    </Section>
  );
}
