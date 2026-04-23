import { useNavigate } from 'react-router-dom';
import { CircleX } from 'lucide-react';

export function PrintOrderCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-theme-bg">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-theme-secondary-light">
          <CircleX size={40} className="text-theme-secondary" />
        </div>

        <h1 className="text-3xl font-extrabold mb-3 text-theme-text">
          Order cancelled
        </h1>

        <p className="text-lg mb-8 text-theme-muted">
          No worries — your book project is still saved. You can come back and order anytime.
        </p>

        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97] w-full bg-theme-primary"
        >
          Back to Home
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium hover:underline text-theme-muted block mx-auto"
        >
          Back to landing page
        </button>
      </div>
    </div>
  );
}
