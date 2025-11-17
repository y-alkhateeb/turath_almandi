import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  primary: 'border-primary-600',
  white: 'border-white',
  gray: 'border-gray-600',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`
          animate-spin rounded-full border-b-2
          ${sizeClasses[size]}
          ${colorClasses[color]}
          ${className}
        `}
        role="status"
        aria-label="جاري التحميل"
      />
      {text && <p className="mt-4 text-sm text-[var(--text-secondary)]">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)] bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  text = 'جاري التحميل...',
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] bg-opacity-75 rounded-lg">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}
