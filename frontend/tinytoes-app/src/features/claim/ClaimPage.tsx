import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export function ClaimPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, claim, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!code.trim()) {
      setError('Please enter your claim code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await claim(email.trim(), code.trim().toUpperCase());
      navigate('/home', { replace: true });
    } catch {
      setError(authError || 'Activation failed. Please check your code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCode = (val: string) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const parts = [];
    if (clean.length > 0) parts.push(clean.slice(0, 4));
    if (clean.length > 4) parts.push(clean.slice(4, 8));
    if (clean.length > 8) parts.push(clean.slice(8, 12));
    return parts.join('-');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--color-primary-light)' }}>
            <span role="img" aria-label="baby foot">&#x1F9B6;</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>TinyToesAndUs</h1>
          <p className="text-base mt-1" style={{ color: 'var(--color-primary)' }}>Baby First Bites</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
              Enter your email and claim code to activate your journal.
            </p>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Claim Code"
              placeholder="TINY-XXXX-XXXX"
              value={code}
              onChange={e => setCode(formatCode(e.target.value))}
              maxLength={14}
              autoComplete="off"
              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />

            {(error || authError) && (
              <p className="text-sm text-red-500 text-center">{error || authError}</p>
            )}

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Activate
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--color-muted)' }}>
          Haven't received your code? Check your purchase confirmation email.
        </p>
      </div>
    </div>
  );
}
