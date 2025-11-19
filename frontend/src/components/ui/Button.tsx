import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-brand-gold-500 text-white hover:bg-brand-gold-600 focus:ring-brand-gold-500 disabled:bg-brand-gold-300',
  secondary:
    'bg-brand-green-500 text-white hover:bg-brand-green-600 focus:ring-brand-green-500 disabled:bg-brand-green-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  outline:
    'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-brand-gold-500 hover:bg-brand-cream-100 focus:ring-brand-gold-500 disabled:bg-[var(--bg-tertiary)]',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-brand-cream-100 focus:ring-brand-gold-500 disabled:bg-transparent disabled:text-[var(--text-secondary)]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        transition-colors duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5 ml-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
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
      {!isLoading && leftIcon && (
        <span className="ml-2" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="mr-2" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
