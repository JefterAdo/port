import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils';

// Base props for the button, not including props from the 'as' component
interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  // disabled is handled by HTML attributes
}

// Props when 'asChild' is true
interface ButtonAsChildProps extends ButtonBaseProps {
  asChild: true;
  as?: never; // 'as' is not used when 'asChild' is true
}

// Props when 'as' is used (and 'asChild' is false or undefined)
interface ButtonAsCompProps<E extends React.ElementType> extends ButtonBaseProps {
  as?: E;
  asChild?: false;
}

// Combine with the native HTML attributes of the rendered component
// Use a union type to correctly discriminate between 'asChild' and 'as' prop usage.
type PolymorphicButtonProps<E extends React.ElementType = 'button'> = (
  | ButtonAsChildProps
  | ButtonAsCompProps<E>
) & Omit<React.ComponentPropsWithoutRef<E extends 'button' ? 'button' : E>, keyof ButtonBaseProps>; 
// Omit props from ButtonBaseProps to avoid conflicts, and ensure 'button' is the default if E is not specified

const Button = React.forwardRef<
  // Type of the element that will be rendered. Default to HTMLButtonElement.
  // This needs to be flexible enough for Slot when asChild is true.
  React.ElementRef<typeof Slot | 'button'>, 
  PolymorphicButtonProps<React.ElementType> // Accept any element type for props
>((
  {
    as,
    asChild,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    children,
    className,
    disabled, // native HTML disabled
    ...props
  },
  ref
) => {
  const ComponentToRender = asChild ? Slot : as || 'button';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white',
    outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-700',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
    danger: 'bg-error hover:bg-error/90 text-white',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-base px-6 py-3 rounded-md',
  };

  const actualDisabled = isLoading || disabled;

  return (
    <ComponentToRender
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        actualDisabled ? 'opacity-50 pointer-events-none' : '',
        variantClasses[variant as keyof typeof variantClasses], // Type assertion
        sizeClasses[size as keyof typeof sizeClasses],         // Type assertion
        fullWidth && 'w-full',
        className
      )}
      // Only pass the 'disabled' HTML attribute if it's a button and actually disabled
      // For other components like <a> (rendered by Link), 'disabled' is not standard.
      // The CSS (pointer-events-none, opacity) handles the disabled state visually and interactively.
      {...(ComponentToRender === 'button' && actualDisabled ? { disabled: true } : {})}
      {...props} // Spread remaining props, this is where `to` for Link would go
    >
      {isLoading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
      )}
      {children}
    </ComponentToRender>
  );
});

Button.displayName = 'Button';
export default Button;