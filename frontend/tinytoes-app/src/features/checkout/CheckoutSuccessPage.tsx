import { useNavigate } from 'react-router-dom';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--color-primary-light)' }}>
          🎉
        </div>

        <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>
          You're all set!
        </h1>

        <p className="text-lg mb-2" style={{ color: 'var(--color-muted)' }}>
          Thank you for your purchase.
        </p>

        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--color-panel)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            Your <strong>claim code</strong> is on its way to your email. It usually arrives within a minute or two. Check your spam folder if you don't see it.
          </p>
        </div>

        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Once you have your code, activate your journal:
        </p>

        <button
          onClick={() => navigate('/claim')}
          className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] w-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Activate My Journal
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-muted)' }}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
