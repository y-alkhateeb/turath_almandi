/**
 * Enhanced EmptyState Component
 * Beautiful, contextual empty states with variants and actions
 */

import React from 'react';
import { Button } from '@/ui/button';
import { cn } from '@/utils';

export interface EmptyStateProps {
  variant?: 'default' | 'filter' | 'error' | 'permission';
  icon: React.ReactNode;
  title: string;
  description: string;
  illustration?: React.ReactNode;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'outline' | 'ghost';
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Size configuration
const sizeConfig = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    iconWrapper: 'p-3',
    title: 'text-base',
    desc: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    iconWrapper: 'p-4',
    title: 'text-lg',
    desc: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    iconWrapper: 'p-5',
    title: 'text-xl',
    desc: 'text-base',
  },
};

// Variant color configuration
const variantConfig = {
  default: {
    iconBg: 'bg-blue-50 border-2 border-blue-100',
    iconColor: 'text-blue-600',
  },
  filter: {
    iconBg: 'bg-yellow-50 border-2 border-yellow-100',
    iconColor: 'text-yellow-600',
  },
  error: {
    iconBg: 'bg-red-50 border-2 border-red-100',
    iconColor: 'text-red-600',
  },
  permission: {
    iconBg: 'bg-purple-50 border-2 border-purple-100',
    iconColor: 'text-purple-600',
  },
};

/**
 * EmptyState Component
 *
 * Displays a beautiful empty state with contextual messaging and actions.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   variant="default"
 *   icon={<Users className="w-full h-full" />}
 *   title="لا يوجد مستخدمون"
 *   description="أضف مستخدمين جدد لبدء استخدام النظام."
 *   actions={{
 *     primary: { label: 'إضافة مستخدم', onClick: () => {} }
 *   }}
 *   size="lg"
 * />
 * ```
 */
export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  illustration,
  actions,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizes = sizeConfig[size];
  const colors = variantConfig[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        sizes.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon with styled background */}
      <div
        className={cn(
          'rounded-full mb-6 transition-all duration-200',
          colors.iconBg,
          sizes.iconWrapper
        )}
        aria-hidden="true"
      >
        <div className={cn(sizes.icon, colors.iconColor)}>{icon}</div>
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold text-[var(--text-primary)] mb-2', sizes.title)}>{title}</h3>

      {/* Description */}
      <p className={cn('text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed', sizes.desc)}>
        {description}
      </p>

      {/* Actions */}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions.primary && (
            <Button
              onClick={actions.primary.onClick}
              variant={actions.primary.variant || 'default'}
              size={size === 'lg' ? 'default' : 'sm'}
              className="min-w-[160px]"
            >
              {actions.primary.label}
            </Button>
          )}
          {actions.secondary && (
            <Button
              variant="outline"
              onClick={actions.secondary.onClick}
              size={size === 'lg' ? 'default' : 'sm'}
              className="min-w-[160px]"
            >
              {actions.secondary.label}
            </Button>
          )}
        </div>
      )}

      {/* Optional Illustration */}
      {illustration && <div className="mt-8 max-w-xs opacity-40">{illustration}</div>}
    </div>
  );
}

/**
 * Legacy EmptyStateIcon - kept for backward compatibility
 * @deprecated Use Lucide React icons directly
 */
export function EmptyStateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-full h-full"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}
