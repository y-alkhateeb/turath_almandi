/**
 * CategorySelector - مكون اختيار الفئة بتصميم شبكي
 * بديل أفضل للقائمة المنسدلة لتجربة مستخدم أسهل
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon';
import type { CategoryOption } from '@/constants/transactionCategories';

// أيقونات الفئات
const CATEGORY_ICONS: Record<string, string> = {
  // Income categories
  INVENTORY_SALES: 'lucide:shopping-cart',
  CAPITAL_ADDITION: 'lucide:piggy-bank',
  APP_PURCHASES: 'lucide:smartphone',
  DEBT_PAYMENT: 'lucide:hand-coins',
  // Expense categories
  EMPLOYEE_SALARIES: 'lucide:users',
  WORKER_DAILY: 'lucide:hard-hat',
  SUPPLIES: 'lucide:package-open',
  MAINTENANCE: 'lucide:wrench',
  INVENTORY: 'lucide:boxes',
  DEBT: 'lucide:credit-card',
  COMPLIMENTARY: 'lucide:gift',
  DISCOUNT: 'lucide:percent',
  TABLE: 'lucide:utensils-crossed',
  CASHIER_SHORTAGE: 'lucide:alert-triangle',
  RETURNS: 'lucide:undo-2',
  OTHER_EXPENSE: 'lucide:more-horizontal',
};

// ألوان الفئات (تدرجات ناعمة)
const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  // Income - ألوان خضراء/زرقاء
  INVENTORY_SALES: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  CAPITAL_ADDITION: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  APP_PURCHASES: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-700',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  DEBT_PAYMENT: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-700',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  // Expense - ألوان متنوعة
  EMPLOYEE_SALARIES: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  WORKER_DAILY: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  SUPPLIES: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-700',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  MAINTENANCE: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  INVENTORY: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-700',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  DEBT: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    icon: 'text-red-600 dark:text-red-400',
  },
  COMPLIMENTARY: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700',
    icon: 'text-pink-600 dark:text-pink-400',
  },
  DISCOUNT: {
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    border: 'border-lime-200 dark:border-lime-700',
    icon: 'text-lime-600 dark:text-lime-400',
  },
  TABLE: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  CASHIER_SHORTAGE: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  RETURNS: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  OTHER_EXPENSE: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
  },
};

// الألوان الافتراضية
const DEFAULT_COLORS = {
  bg: 'bg-gray-50 dark:bg-gray-900/20',
  border: 'border-gray-200 dark:border-gray-700',
  icon: 'text-gray-600 dark:text-gray-400',
};

interface CategorySelectorProps {
  categories: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CategorySelector({
  categories,
  value,
  onChange,
  disabled = false,
  className,
}: CategorySelectorProps) {
  const getCategoryIcon = (categoryValue: string) => {
    return CATEGORY_ICONS[categoryValue] || 'lucide:circle';
  };

  const getCategoryColors = (categoryValue: string) => {
    return CATEGORY_COLORS[categoryValue] || DEFAULT_COLORS;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        اختر الفئة <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((category) => {
          const isSelected = value === category.value;
          const colors = getCategoryColors(category.value);
          const icon = getCategoryIcon(category.value);

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => !disabled && onChange(category.value)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                'min-h-[100px]',
                'hover:scale-[1.02] active:scale-[0.98]',
                disabled && 'opacity-50 cursor-not-allowed',
                isSelected
                  ? cn(
                      'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
                      'border-primary-500 dark:border-primary-400',
                      'bg-primary-50 dark:bg-primary-900/30',
                      'shadow-lg shadow-primary-100 dark:shadow-primary-900/20'
                    )
                  : cn(
                      colors.bg,
                      colors.border,
                      'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600'
                    )
              )}
            >
              {/* أيقونة التحديد */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="w-5 h-5 text-primary-500"
                  />
                </div>
              )}

              {/* أيقونة الفئة */}
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-800/50'
                    : 'bg-white/50 dark:bg-gray-800/50'
                )}
              >
                <Icon
                  icon={icon}
                  className={cn(
                    'w-6 h-6',
                    isSelected ? 'text-primary-600 dark:text-primary-400' : colors.icon
                  )}
                />
              </div>

              {/* اسم الفئة */}
              <span
                className={cn(
                  'text-sm font-medium text-center leading-tight',
                  isSelected
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-[var(--text-primary)]'
                )}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySelector;
