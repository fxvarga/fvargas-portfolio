import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-theme-bg">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-theme-primary-light">
          <PartyPopper size={40} className="text-theme-primary" />
        </div>

        <h1 className="text-3xl font-extrabold mb-3 text-theme-text">
          You're all set!
        </h1>

        <p className="text-lg mb-2 text-theme-muted">
          Thank you for your purchase.
        </p>

        <div className="rounded-2xl p-6 mb-8 bg-theme-panel">
          <p className="text-sm leading-relaxed text-theme-text">
            Your <strong>claim code</strong> is on its way to your email. It usually arrives within a minute or two. Check your spam folder if you don't see it.
          </p>
        </div>

        <p className="text-sm mb-6 text-theme-muted">
          Once you have your code, activate your journal:
        </p>

        <button
          onClick={() => navigate('/claim')}
          className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] w-full bg-theme-primary"
        >
          Activate My Journal
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium hover:underline text-theme-muted"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
