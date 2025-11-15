import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    trend: 'text-sky-600',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
  danger: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  neutral: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    trend: 'text-gray-600',
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  color = 'primary',
  className = '',
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        shadow-md hover:shadow-lg transition-shadow duration-200
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>

          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {description && (
                <span className="text-sm text-gray-500 mr-2">
                  {description}
                </span>
              )}
            </div>
          )}

          {!trend && description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className={`w-6 h-6 ${colors.icon}`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
