import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down';
  description?: string;
  className?: string;
}

export const StatCard = React.memo(function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend = 'up',
  description,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-dark-secondary/60 p-6 rounded-2xl border-2 border-brand-gold-500/30 dark:border-dark-border shadow-sm dark:shadow-gold-sm hover:shadow-lg dark:hover:shadow-gold-lg hover:-translate-y-2 transition-all overflow-hidden',
        className
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-brand-green-400 dark:text-dark-text-secondary font-semibold mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-brand-green-600 dark:bg-gradient-to-r dark:from-dark-text-primary dark:to-brand-gold-300 dark:bg-clip-text dark:text-transparent">
            {value}
          </h3>
          {change && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-semibold mt-2',
                trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change}</span>
            </div>
          )}
          {description && !change && (
            <p className="text-sm text-brand-green-400 dark:text-dark-text-secondary mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="w-14 h-14 rounded-xl bg-brand-cream-200 dark:bg-dark-tertiary/80 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:-rotate-[5deg] group-hover:bg-gradient-to-br group-hover:from-brand-gold-300 group-hover:to-brand-gold-500 transition-all">
          <Icon className="w-7 h-7 text-brand-gold-500 dark:text-brand-gold-300 group-hover:text-white" />
        </div>
      </div>
    </div>
  );
});
