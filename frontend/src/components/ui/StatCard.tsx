import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down';
  description?: React.ReactNode;
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
        'group relative card p-6 hover:shadow-lg hover:-translate-y-2 transition-all overflow-hidden',
        className
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-[var(--text-secondary)] font-semibold mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{value}</h3>
          {change && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-semibold',
                trend === 'up' ? 'text-success-600' : 'text-danger-600'
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
            <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
        <div className="w-14 h-14 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shadow-md group-hover:scale-110 group-hover:-rotate-[5deg] group-hover:bg-gradient-to-br group-hover:from-brand-gold-300 group-hover:to-brand-gold-500 transition-all">
          <Icon className="w-7 h-7 text-brand-gold-500 group-hover:text-white" />
        </div>
      </div>
    </div>
  );
});
