import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  primary: 'bg-brand-gold-100 text-brand-gold-800 border-brand-gold-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)]',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const dotClasses = {
  primary: 'bg-brand-gold-600',
  success: 'bg-green-600',
  warning: 'bg-amber-600',
  danger: 'bg-red-600',
  neutral: 'bg-gray-600',
  info: 'bg-blue-600',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full ml-1.5 ${dotClasses[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
