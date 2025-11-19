/**
 * Skeleton - Base Component
 * Animated loading skeleton for placeholder content
 *
 * Based on shadcn/ui Skeleton component
 */

import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--bg-tertiary)] ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
