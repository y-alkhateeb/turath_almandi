/**
 * EmptyState - Presentational Component
 * Displays an empty state with optional icon, title, description, and action
 *
 * Features:
 * - Centered layout
 * - Optional icon (custom or default)
 * - Title and optional description
 * - Optional action button (e.g., "إضافة جديد")
 * - RTL support
 * - Responsive
 */

import { Inbox } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      dir="rtl"
    >
      {/* Icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
        {icon || <Inbox className="w-8 h-8 text-[var(--text-tertiary)]" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
