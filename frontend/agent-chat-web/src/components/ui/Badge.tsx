import { cn } from '@/lib/utils';
import type { RiskTier } from '@/types';
import { AlertTriangle, Info, AlertCircle, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-700/50 text-gray-300 border-gray-600/50',
    success: 'bg-green-500/10 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium border',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface RiskBadgeProps {
  riskTier: RiskTier;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function RiskBadge({ riskTier, size = 'md', showIcon = false, className }: RiskBadgeProps) {
  // Use semantic colors: green (safe) -> blue (info) -> orange (caution) -> red (danger)
  const config: Record<RiskTier, { variant: 'success' | 'info' | 'warning' | 'danger'; icon: React.ReactNode }> = {
    Low: { 
      variant: 'success',
      icon: <Info className="w-3 h-3" />
    },
    Medium: { 
      variant: 'info',
      icon: <AlertCircle className="w-3 h-3" />
    },
    High: { 
      variant: 'warning', // Orange/amber for caution
      icon: <AlertTriangle className="w-3 h-3" />
    },
    Critical: { 
      variant: 'danger',
      icon: <ShieldAlert className="w-3 h-3" />
    },
  };

  // Guard against undefined or invalid riskTier
  const tier = riskTier && riskTier in config ? riskTier : 'Low';
  const { variant, icon } = config[tier];

  return (
    <Badge variant={variant} size={size} className={className}>
      {showIcon && <span className="mr-1">{icon}</span>}
      {tier} Risk
    </Badge>
  );
}
