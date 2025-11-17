/**
 * Financial Card Component
 * Displays a financial metric with icon, title, value, and optional breakdown
 */

interface FinancialCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple';
  breakdown?: { label: string; value: number }[];
  isLoading?: boolean;
}

/**
 * Format number to Arabic locale with proper thousands separators
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Color configurations for different card types
 */
const colorConfigs = {
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-500 text-white',
    text: 'text-green-700',
    valueText: 'text-green-900',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'bg-red-500 text-white',
    text: 'text-red-700',
    valueText: 'text-red-900',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-500 text-white',
    text: 'text-blue-700',
    valueText: 'text-blue-900',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-500 text-white',
    text: 'text-purple-700',
    valueText: 'text-purple-900',
  },
};

export const FinancialCard = ({
  title,
  value,
  icon,
  color,
  breakdown,
  isLoading = false,
}: FinancialCardProps) => {
  const config = colorConfigs[color];

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-24"></div>
            <div className="h-12 w-12 bg-[var(--bg-tertiary)] rounded-lg"></div>
          </div>
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-4"></div>
          {breakdown && (
            <div className="space-y-2">
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full"></div>
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-sm font-medium ${config.text} mb-1`}>
            {title}
          </h3>
        </div>
        <div className={`${config.icon} p-3 rounded-lg shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className={`text-3xl font-bold ${config.valueText} mb-2 font-arabic`}>
        {formatCurrency(value)} د.ع
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-2">
          {breakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)] font-arabic">{item.label}</span>
              <span className={`font-semibold ${config.text} font-arabic`}>
                {formatCurrency(item.value)} د.ع
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
