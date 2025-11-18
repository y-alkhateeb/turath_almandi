/**
 * DashboardStatCard - Presentational Component
 *
 * Displays a single dashboard statistic with icon, title, value, and optional trend.
 * Pure component with no business logic.
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/ui/card';
import { cn } from '@/utils';
import type { LucideIcon } from 'lucide-react';

export interface DashboardStatCardProps {
  /** Card title */
  title: string;
  /** Displayed value (formatted) */
  value: string | number;
  /** Icon component */
  icon: LucideIcon;
  /** Optional description text */
  description?: string;
  /** Color theme */
  color: 'blue' | 'green' | 'red' | 'purple';
  /** Optional trend data */
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-100',
  },
};

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  trend,
}: DashboardStatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={cn('border-2', colors.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">{value}</p>
            {description && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
