import { useState, FormEvent } from 'react';
import Section from '../layout/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import useScrollReveal from '../../hooks/useScrollReveal';
import type { LeadCapture } from '../../cms';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface LeadCaptureSectionProps {
  leadCapture: LeadCapture;
}

interface FormData {
  fullName: string;
  email: string;
  company: string;
  industry: string;
  problemDescription: string;
}

export default function LeadCaptureSection({ leadCapture }: LeadCaptureSectionProps) {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    company: '',
    industry: '',
    problemDescription: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const reveal = useScrollReveal();

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
      const res = await fetch(leadCapture.apiEndpoint, {
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

      // GA4 conversion event
      if (window.gtag) {
        window.gtag('event', 'generate_lead', {
          event_category: 'engagement',
          event_label: form.industry || 'unknown',
          value: 1,
          currency: 'USD',
        });
      }

      setStatus('success');
      setForm({ fullName: '', email: '', company: '', industry: '', problemDescription: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : leadCapture.errorMessage);
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
          <h2 className="font-heading font-bold text-2xl text-gray-900">{leadCapture.successHeading}</h2>
          <p className="mt-2 text-gray-600">{leadCapture.successMessage}</p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="lead-form" className="bg-primary-50">
      <div className="max-w-xl mx-auto" ref={reveal.ref} style={reveal.style}>
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
            {leadCapture.heading}
          </h2>
          <p className="mt-4 text-gray-600">
            {leadCapture.subheading}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="fullName"
              label={leadCapture.nameLabel}
              placeholder={leadCapture.namePlaceholder}
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
            />
            <Input
              id="email"
              label={leadCapture.emailLabel}
              type="email"
              placeholder={leadCapture.emailPlaceholder}
              required
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="company"
              label={leadCapture.companyLabel}
              placeholder={leadCapture.companyPlaceholder}
              value={form.company}
              onChange={handleChange('company')}
            />
            <Select
              id="industry"
              label={leadCapture.industryLabel}
              options={leadCapture.industries}
              value={form.industry}
              onChange={handleChange('industry')}
            />
          </div>

          <Textarea
            id="problemDescription"
            label={leadCapture.problemLabel}
            placeholder={leadCapture.problemPlaceholder}
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
            {status === 'submitting' ? leadCapture.submittingButtonText : leadCapture.submitButtonText}
          </Button>

          <p className="text-center text-xs text-gray-500">
            {leadCapture.privacyText}
          </p>
        </form>
      </div>
    </Section>
  );
}
