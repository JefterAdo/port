import React from 'react';
import { cn } from '../../utils';

type InputProps = {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    hint,
    fullWidth = false,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className={cn('flex flex-col space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          className={cn(
            'flex h-10 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
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

Input.displayName = 'Input';

export default Input;