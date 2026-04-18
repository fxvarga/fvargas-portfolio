import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border text-base transition-colors duration-200 outline-none placeholder:text-theme-muted/50 ${error ? 'border-red-400' : 'border-[var(--color-accent)] focus:border-[var(--color-primary)]'} ${className}`}
          style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
