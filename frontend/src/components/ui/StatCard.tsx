import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
  },
};

export const StatCard = React.memo(function StatCard({
  title,
  value,
  icon: Icon,
  change,
  description,
  color = 'blue',
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-6',
        'shadow-md hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>

          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              {description && (
                <span className="text-sm text-gray-500 mr-2">
                  {description}
                </span>
              )}
            </div>
          )}

          {change === undefined && description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>

        <div className={cn('p-3 rounded-lg', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  );
});
