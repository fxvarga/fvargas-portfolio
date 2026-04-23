import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { PrintOrder } from '@/types';
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle, ExternalLink, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: typeof Package; label: string; color: string; description: string }> = {
  created:              { icon: Clock,          label: 'Order Created',      color: 'text-theme-muted',    description: 'Your order has been received.' },
  uploading:            { icon: Clock,          label: 'Processing',         color: 'text-theme-muted',    description: 'Uploading your book files.' },
  unpaid:               { icon: Clock,          label: 'Awaiting Payment',   color: 'text-amber-500',      description: 'Waiting for payment confirmation.' },
  payment_in_progress:  { icon: Clock,          label: 'Payment Processing', color: 'text-amber-500',      description: 'Payment is being processed.' },
  production_ready:     { icon: Package,        label: 'Ready to Print',     color: 'text-theme-primary',  description: 'Your book is queued for printing.' },
  in_production:        { icon: Package,        label: 'Printing',           color: 'text-theme-primary',  description: 'Your book is being printed right now.' },
  shipped:              { icon: Truck,          label: 'Shipped',            color: 'text-theme-secondary', description: 'Your book is on the way!' },
  delivered:            { icon: CheckCircle,    label: 'Delivered',          color: 'text-green-600',      description: 'Your book has been delivered.' },
  cancelled:            { icon: AlertTriangle,  label: 'Cancelled',          color: 'text-red-500',        description: 'This order was cancelled.' },
  error:                { icon: AlertTriangle,  label: 'Error',              color: 'text-red-500',        description: 'Something went wrong with this order.' },
};

const STATUS_STEPS = ['created', 'production_ready', 'in_production', 'shipped', 'delivered'];

export function OrderStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getOrder(token);
      setOrder(data);
    } catch (e: any) {
      setError(e.message || 'Order not found.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [token]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell>
        <PageHeader title="Order Status" />
        <div className="px-4 pb-8">
          <Card padding="lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle size={32} className="text-red-500" />
              <p className="text-sm font-medium text-theme-text">{error || 'Order not found'}</p>
              <p className="text-xs text-theme-muted">Check your email for the correct order link.</p>
            </div>
          </Card>
        </div>
      </PageShell>
    );
  }

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
  const StatusIcon = config.icon;
  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <PageShell>
      <PageHeader
        title="Order Status"
        actions={
          <button
            onClick={fetchOrder}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-theme-muted"
          >
            <RefreshCw size={20} />
          </button>
        }
      />

      <div className="px-4 pb-8 space-y-6">
        {/* Status hero */}
        <Card padding="lg">
          <div className="flex flex-col items-center gap-3 text-center">
            <StatusIcon size={40} className={config.color} />
            <h2 className="text-xl font-bold text-theme-text">{config.label}</h2>
            <p className="text-sm text-theme-muted">{config.description}</p>
          </div>
        </Card>

        {/* Progress steps */}
        {currentStepIdx >= 0 && (
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const isComplete = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-all ${
                      isComplete ? 'bg-theme-primary' : 'bg-theme-accent/40'
                    }`}
                  />
                  <span className={`text-[8px] ${isCurrent ? 'font-bold text-theme-primary' : 'text-theme-muted'}`}>
                    {STATUS_CONFIG[step]?.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Order details */}
        <Card padding="md">
          <div className="space-y-3">
            <DetailRow label="Product" value={order.productName} />
            <DetailRow label="Pages" value={order.pageCount.toString()} />
            <DetailRow label="Total" value={`$${order.totalPriceUsd.toFixed(2)}`} />
            <DetailRow label="Ordered" value={new Date(order.createdAt).toLocaleDateString()} />
            {order.trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-muted">Tracking</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-theme-primary flex items-center gap-1"
                  >
                    {order.trackingNumber} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-xs font-medium text-theme-text">{order.trackingNumber}</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-theme-muted">{label}</span>
      <span className="text-xs font-medium text-theme-text">{value}</span>
    </div>
  );
}
