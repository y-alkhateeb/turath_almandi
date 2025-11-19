import React from 'react';
import { PageHeader, type PageHeaderProps } from '../ui/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { ApiError } from '@/api/apiClient';

/**
 * PageLayout - Standard page layout wrapper
 *
 * Provides consistent layout structure for all pages including:
 * - Page header with title, description, and actions
 * - Error display
 * - Consistent spacing and padding
 * - Content area
 *
 * @example
 * ```tsx
 * <PageLayout
 *   title="إدارة الفروع"
 *   description="إدارة جميع فروع المؤسسة"
 *   actions={<Button onClick={handleCreate}>إضافة فرع</Button>}
 * >
 *   <BranchesTable data={branches} />
 * </PageLayout>
 * ```
 */

export interface PageLayoutProps {
  /** Page title (shown in header) */
  title: string;
  /** Optional page description */
  description?: string;
  /** Optional action buttons (e.g., Create button) */
  actions?: React.ReactNode;
  /** Optional breadcrumbs */
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  /** Page content */
  children: React.ReactNode;
  /** Optional error to display (supports Error, ApiError) */
  error?: Error | ApiError | null;
  /** Optional retry callback for error state */
  onRetry?: () => void;
  /** Optional: Hide header */
  hideHeader?: boolean;
  /** Optional: Custom spacing class */
  spacing?: 'default' | 'compact' | 'loose';
  /** Optional: Custom class name for the container */
  className?: string;
}

const spacingClasses = {
  default: 'space-y-6',
  compact: 'space-y-4',
  loose: 'space-y-8',
};

export function PageLayout({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  error,
  onRetry,
  hideHeader = false,
  spacing = 'default',
  className = '',
}: PageLayoutProps) {
  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {/* Page Header */}
      {!hideHeader && (
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
      )}

      {/* Error State */}
      {error && <ErrorState error={error} onRetry={onRetry} />}

      {/* Main Content - only show if no error */}
      {!error && children}
    </div>
  );
}
