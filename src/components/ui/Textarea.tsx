import React from 'react';
import { cn } from '../../utils';

type TextareaProps = {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    hint,
    fullWidth = false,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className={cn('flex flex-col space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:ring-error/50',
            fullWidth && 'w-full',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;