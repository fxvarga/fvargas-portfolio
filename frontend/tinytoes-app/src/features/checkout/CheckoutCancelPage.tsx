import { useNavigate } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';

export function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-theme-bg">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-theme-secondary-light">
          <CircleHelp size={40} className="text-theme-secondary" />
        </div>

        <h1 className="text-3xl font-extrabold mb-3 text-theme-text">
          Changed your mind?
        </h1>

        <p className="text-lg mb-8 text-theme-muted">
          No worries — your journal will be here when you're ready. No pressure, no rush.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] w-full bg-theme-primary"
        >
          Back to Home
        </button>

        <p className="text-sm mt-6 text-theme-muted">
          Already have a code?{' '}
          <button onClick={() => navigate('/claim')} className="font-medium hover:underline text-theme-primary">
            Activate here
          </button>
        </p>
      </div>
    </div>
  );
}
