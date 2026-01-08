import { forwardRef, type TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea && autoResize) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      adjustHeight();
    };

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          'w-full px-4 py-3 bg-gray-800/80 border border-gray-700/50 rounded-xl',
          'text-gray-100 placeholder-gray-500 leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
          'hover:border-gray-600/50 hover:bg-gray-800',
          'resize-none transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700/50 disabled:hover:bg-gray-800/80',
          className,
        )}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
