import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { BrandMark } from '@/components/BrandMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ClaimPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, session, claim, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailToUse = isAuthenticated && session?.email ? session.email : email.trim();

    if (!emailToUse) {
      setError('Please enter your email address.');
      return;
    }
    if (!code.trim()) {
      setError('Please enter your claim code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await claim(emailToUse, code.trim().toUpperCase());
      if (isAuthenticated) {
        setSuccess('Product activated! Redirecting...');
        setCode('');
        setTimeout(() => navigate('/year-recap', { replace: true }), 1500);
      } else {
        navigate('/year-recap', { replace: true });
      }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-theme-bg">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandMark size="lg" />
          </div>
          <p className="text-base mt-1 text-theme-primary">
            {isAuthenticated ? 'Activate a new product' : 'Baby First Bites'}
          </p>
        </div>

        {/* Back to app link for authenticated users */}
        {isAuthenticated && (
          <button
            onClick={() => navigate('/year-recap')}
            className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:opacity-70 text-theme-primary"
          >
            <ChevronLeft size={16} />
            Back to app
          </button>
        )}

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-center text-theme-muted">
              {isAuthenticated
                ? 'Enter your claim code to unlock a new product.'
                : 'Enter your email and claim code to activate your journal.'}
            </p>

            {/* Only show email field if not authenticated */}
            {!isAuthenticated && (
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            )}

            {isAuthenticated && (
              <p className="text-xs text-center text-theme-muted">
                Logged in as <span className="font-medium text-theme-text">{session?.email}</span>
              </p>
            )}

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

            {success && (
              <p className="text-sm text-center font-medium text-theme-primary">{success}</p>
            )}

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              {isAuthenticated ? 'Activate Product' : 'Activate'}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center mt-6 text-theme-muted">
          Haven't received your code? Check your purchase confirmation email.
        </p>
      </div>
    </div>
  );
}
