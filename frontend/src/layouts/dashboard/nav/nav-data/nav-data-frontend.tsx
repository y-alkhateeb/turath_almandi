/**
 * Navigation Data Configuration (Frontend Mode)
 * Arabic menu structure for the application with role-based visibility
 *
 * Features:
 * - Role-based menu items (admin-only items hidden from accountants)
 * - Unread notifications badge
 * - Active state highlighting via NavLink
 * - RTL support
 * - Lucide icons via Iconify
 */

import { Icon } from '@/components/icon';
import type { NavItem } from '#/router';
import { UserRole } from '#/enum';

/**
 * Main navigation items
 * Items with roles field are only shown to users with those roles
 */
export const navData: NavItem[] = [
  {
    title: 'لوحة التحكم',
    path: '/dashboard',
    icon: <Icon icon="lucide:layout-dashboard" size={24} />,
    caption: 'نظرة عامة على النشاطات',
  },
  {
    title: 'المعاملات',
    path: '/transactions',
    icon: <Icon icon="lucide:receipt" size={24} />,
    caption: 'إدارة المعاملات المالية',
    children: [
      {
        title: 'قائمة المعاملات',
        path: '/transactions',
      },
      {
        title: 'إضافة مصروف',
        path: '/transactions/create/expense',
        icon: <Icon icon="lucide:trending-down" size={20} />,
      },
      {
        title: 'إضافة إيراد',
        path: '/transactions/create/income',
        icon: <Icon icon="lucide:trending-up" size={20} />,
      },
    ],
  },
  {
    title: 'جهات الاتصال',
    path: '/contacts',
    icon: <Icon icon="lucide:contact" size={24} />,
    caption: 'إدارة الموردين والعملاء',
    children: [
      {
        title: 'قائمة جهات الاتصال',
        path: '/contacts',
      },
    ],
  },
  {
    title: 'الحسابات الدائنة',
    path: '/payables',
    icon: <Icon icon="lucide:arrow-up-circle" size={24} />,
    caption: 'المبالغ المستحقة للموردين',
    children: [
      {
        title: 'قائمة الحسابات الدائنة',
        path: '/payables',
      },
    ],
  },
  {
    title: 'الحسابات المدينة',
    path: '/receivables',
    icon: <Icon icon="lucide:arrow-down-circle" size={24} />,
    caption: 'المبالغ المستحقة من العملاء',
    children: [
      {
        title: 'قائمة الحسابات المدينة',
        path: '/receivables',
      },
    ],
  },
  {
    title: 'المخزون',
    path: '/inventory',
    icon: <Icon icon="lucide:package" size={24} />,
    caption: 'إدارة المخزون والأصناف',
    children: [
      {
        title: 'قائمة المخزون',
        path: '/inventory',
      },
      {
        title: 'إضافة صنف',
        path: '/inventory/create', // This path should now work if a route is defined for it
      },
    ],
  },
  {
    title: 'الموظفون',
    path: '/employees',
    icon: <Icon icon="lucide:users" size={24} />,
    caption: 'إدارة الموظفين والرواتب',
    children: [
      {
        title: 'قائمة الموظفين',
        path: '/employees',
      },
      {
        title: 'إضافة موظف',
        path: '/employees/new',
      },
    ],
  },
  {
    title: 'التقارير',
    path: '/reports',
    icon: <Icon icon="lucide:file-bar-chart" size={24} />,
    caption: 'إنشاء وعرض التقارير',
    children: [
      {
        title: 'منشئ التقارير',
        path: '/reports/smart-builder',
        icon: <Icon icon="lucide:layout-template" size={20} />,
      },
    ],
  },
  {
    title: 'الإشعارات',
    path: '/notifications',
    icon: <Icon icon="lucide:bell" size={24} />,
    caption: 'الإشعارات والتنبيهات',
  },
  {
    title: 'الإعدادات',
    path: '/settings',
    icon: <Icon icon="lucide:settings" size={24} />,
    caption: 'إعدادات النظام',
    roles: [UserRole.ADMIN], // Admin only
    children: [
      {
        title: 'المستخدمين',
        path: '/settings/users',
        icon: <Icon icon="lucide:users" size={20} />,
      },
      {
        title: 'الفروع',
        path: '/settings/branches',
        icon: <Icon icon="lucide:building-2" size={20} />,
      },
      {
        title: 'سجل النشاطات',
        path: '/settings/audit',
        icon: <Icon icon="lucide:file-text" size={20} />,
      },
      {
        title: 'إعدادات التطبيق',
        path: '/settings/app',
        icon: <Icon icon="lucide:app-window" size={20} />,
      },
    ],
  },
];

/**
 * User menu items (profile dropdown)
 * Shown in the user profile dropdown menu
 */
export const userMenuData: NavItem[] = [
  {
    title: 'الملف الشخصي',
    path: '/profile',
    icon: <Icon icon="lucide:user" size={20} />,
  },
  {
    title: 'إعدادات الإشعارات',
    path: '/notifications/settings',
    icon: <Icon icon="lucide:bell" size={20} />,
  },
];

/**
 * Get filtered navigation items based on user role
 * Filters out items that the user doesn't have access to
 *
 * @param items - Navigation items to filter
 * @param userRole - Current user's role
 * @returns Filtered navigation items
 */
export function getFilteredNavItems(
  items: NavItem[],
  userRole: UserRole | null | undefined
): NavItem[] {
  if (!userRole) return [];

  const normalizedUserRole = String(userRole).toUpperCase();

  return items
    .filter((item) => {
      // If item has roles requirement, check if user has required role
      if (item.roles && item.roles.length > 0) {
        return item.roles.some((role) => String(role).toUpperCase() === normalizedUserRole);
      }
      // No role requirement, show to all authenticated users
      return true;
    })
    .map((item) => {
      // Recursively filter children
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: getFilteredNavItems(item.children, userRole),
        };
      }
      return item;
    });
}

/**
 * Check if nav item or its children are active
 * Used for highlighting active menu items
 *
 * @param item - Navigation item to check
 * @param currentPath - Current location pathname
 * @returns true if item is active
 */
export function isNavItemActive(item: NavItem, currentPath: string): boolean {
  // Direct path match
  if (item.path === currentPath) return true;

  // Check if current path starts with item path (for parent items)
  if (item.path && currentPath.startsWith(item.path)) return true;

  // Check children
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isNavItemActive(child, currentPath));
  }

  return false;
}
