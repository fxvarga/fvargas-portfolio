import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail } from 'lucide-react';

export function PrintOrderSuccessPage() {
  const navigate = useNavigate();

  // Mark pending order as completed
  useEffect(() => {
    try {
      const pendingId = localStorage.getItem('tinytoes_pending_order');
      if (pendingId) {
        const orders = JSON.parse(localStorage.getItem('tinytoes_print_orders') || '[]');
        const order = orders.find((o: any) => o.id === pendingId);
        if (order) order.status = 'ordered';
        localStorage.setItem('tinytoes_print_orders', JSON.stringify(orders));
        localStorage.removeItem('tinytoes_pending_order');
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-theme-bg">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-theme-primary-light">
          <BookOpen size={40} className="text-theme-primary" />
        </div>

        <h1 className="text-3xl font-extrabold mb-3 text-theme-text">
          Your book is on its way!
        </h1>

        <p className="text-lg mb-2 text-theme-muted">
          Thank you for your order.
        </p>

        <div className="rounded-2xl p-6 mb-8 bg-theme-panel">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Mail size={18} className="text-theme-primary" />
            <span className="text-sm font-semibold text-theme-text">Check your email</span>
          </div>
          <p className="text-sm leading-relaxed text-theme-text">
            We've sent you a <strong>tracking link</strong> so you can follow your book from printing to delivery. It usually arrives within a few minutes.
          </p>
        </div>

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
