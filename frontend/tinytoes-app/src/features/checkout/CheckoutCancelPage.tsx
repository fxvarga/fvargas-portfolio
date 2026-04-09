import { useNavigate } from 'react-router-dom';

export function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--color-secondary-light)' }}>
          🤔
        </div>

        <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>
          Changed your mind?
        </h1>

        <p className="text-lg mb-8" style={{ color: 'var(--color-muted)' }}>
          No worries — your journal will be here when you're ready. No pressure, no rush.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] w-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Back to Home
        </button>

        <p className="text-sm mt-6" style={{ color: 'var(--color-muted)' }}>
          Already have a code?{' '}
          <button onClick={() => navigate('/claim')} className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
            Activate here
          </button>
        </p>
      </div>
    </div>
  );
}
