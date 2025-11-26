/**
 * Breadcrumb Component
 * Auto-generates breadcrumb navigation from current route path
 *
 * Features:
 * - Auto-generates from route path
 * - Maps paths to Arabic labels
 * - Home → current page hierarchy
 * - Clickable links for navigation
 * - RTL support
 * - Handles dynamic route params (IDs)
 *
 * Usage:
 * <Breadcrumb />
 * Automatically generates breadcrumbs based on current location
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Path segment to Arabic label mapping
 * Add new route segments here to customize labels
 */
const pathLabels: Record<string, string> = {
  // Main sections
  dashboard: 'لوحة التحكم',
  transactions: 'المعاملات',
  debts: 'الديون',
  inventory: 'المخزون',
  reports: 'التقارير',
  notifications: 'الإشعارات',
  profile: 'الملف الشخصي',
  management: 'الإدارة',
  system: 'النظام',

  // Actions
  list: 'القائمة',
  create: 'إضافة جديد',
  edit: 'تعديل',
  view: 'عرض',
  settings: 'الإعدادات',

  // Resources
  users: 'المستخدمين',
  branches: 'الفروع',
  audit: 'سجل النشاطات',

  // Transaction types
  income: 'الإيرادات',
  expense: 'المصروفات',

  // Other
  pay: 'دفع',
  history: 'السجل',
};

/**
 * Get Arabic label for path segment
 * Handles UUIDs and numeric IDs
 */
function getPathLabel(segment: string): string {
  // Check if it's a UUID or ID (starts with number or contains dashes)
  const isId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^\d+$/.test(segment);

  if (isId) {
    return `#${segment.substring(0, 8)}`; // Show first 8 chars of ID
  }

  // Return mapped label or capitalize segment
  return pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Split path and filter empty segments
  const segments = pathname.split('/').filter(Boolean);

  // Always start with home/dashboard
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'الرئيسية',
      path: '/dashboard',
      isLast: segments.length === 0 || pathname === '/dashboard',
    },
  ];

  // Build breadcrumbs from segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      label: getPathLabel(segment),
      path: currentPath,
      isLast,
    });
  });

  return breadcrumbs;
}

export interface BreadcrumbProps {
  className?: string;
  /**
   * Custom breadcrumb items (overrides auto-generation)
   */
  items?: BreadcrumbItem[];
}

/**
 * Breadcrumb Component
 * Shows navigation hierarchy with clickable links
 */
export function Breadcrumb({ className, items: customItems }: BreadcrumbProps) {
  const location = useLocation();

  // Use custom items or auto-generate from location
  const items = customItems || generateBreadcrumbs(location.pathname);

  // Don't show breadcrumbs if only home
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {/* Separator (RTL: show before item except first) */}
            {index > 0 && (
              <ChevronLeft
                className="w-4 h-4 text-[var(--text-secondary)] rotate-180"
                aria-hidden="true"
              />
            )}

            {/* Breadcrumb item */}
            {item.isLast ? (
              // Current page - not clickable
              <span className="font-medium text-[var(--text-primary)]" aria-current="page">
                {item.label}
              </span>
            ) : (
              // Parent pages - clickable
              <Link
                to={item.path}
                className={cn(
                  'font-medium transition-colors',
                  'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  // First item (home) styling
                  index === 0 && 'flex items-center gap-1'
                )}
              >
                {index === 0 && <Home className="w-4 h-4" aria-hidden="true" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Export type for custom breadcrumb items
 */
export type { BreadcrumbItem };
