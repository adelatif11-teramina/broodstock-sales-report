import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none shadow-sm';

    const variants = {
      primary: 'bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue)]/90 focus:ring-[var(--brand-red)] focus:ring-offset-[var(--brand-surface)]',
      secondary: 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 focus:ring-[var(--brand-blue)] focus:ring-offset-[var(--brand-surface)]',
      outline: 'border border-[var(--brand-blue)] text-[var(--brand-blue)] bg-white/80 hover:bg-[var(--brand-blue)]/10 focus:ring-[var(--brand-blue)] focus:ring-offset-[var(--brand-surface)]',
      ghost: 'text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 focus:ring-[var(--brand-blue)] focus:ring-offset-[var(--brand-surface)]',
      danger: 'bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red)]/90 focus:ring-[var(--brand-blue)] focus:ring-offset-[var(--brand-surface)]',
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-xs uppercase',
      md: 'px-5 py-2.5 text-sm uppercase',
      lg: 'px-7 py-3 text-base uppercase',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
