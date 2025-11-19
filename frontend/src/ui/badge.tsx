import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500 text-white shadow hover:bg-primary-600',
        secondary:
          'border-transparent bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
        destructive: 'border-transparent bg-danger-500 text-white shadow hover:bg-danger-600',
        outline: 'border-[var(--border-color)] text-[var(--text-primary)]',
        success: 'border-transparent bg-success-500 text-white shadow hover:bg-success-600',
        warning: 'border-transparent bg-warning-500 text-white shadow hover:bg-warning-600',
        info: 'border-transparent bg-primary-100 text-primary-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
