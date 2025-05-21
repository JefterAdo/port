import React from 'react';
import { cn } from '../../utils';

type BadgeProps = {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
} & React.HTMLAttributes<HTMLSpanElement>;

const Badge = ({ 
  className, 
  variant = 'primary', 
  ...props 
}: BadgeProps) => {
  const variantClasses = {
    primary: 'bg-primary-light/20 text-primary-dark',
    secondary: 'bg-secondary-light/20 text-secondary-dark',
    outline: 'border border-neutral-200 text-neutral-700',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-error/20 text-error',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;