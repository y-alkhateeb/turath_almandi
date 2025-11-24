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
        path: '/transactions/list',
      },
      {
        title: 'إضافة معاملة',
        path: '/transactions/create',
      },
    ],
  },
  {
    title: 'الديون',
    path: '/debts',
    icon: <Icon icon="lucide:wallet" size={24} />,
    caption: 'إدارة الديون والدفعات',
    children: [
      {
        title: 'قائمة الديون',
        path: '/debts/list',
      },
      {
        title: 'إضافة دين',
        path: '/debts/create',
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
        path: '/inventory/list',
      },
      {
        title: 'إضافة صنف',
        path: '/inventory/create',
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
        path: '/employees/create',
      },
    ],
  },
  {
    title: 'التقارير',
    path: '/reports',
    icon: <Icon icon="lucide:file-bar-chart" size={24} />,
    caption: 'التقارير المالية والإحصائية',
  },
  {
    title: 'الإشعارات',
    path: '/notifications',
    icon: <Icon icon="lucide:bell" size={24} />,
    caption: 'الإشعارات والتنبيهات',
  },
  {
    title: 'الإعدادات',
    path: '/management/system',
    icon: <Icon icon="lucide:settings" size={24} />,
    caption: 'إعدادات النظام',
    roles: [UserRole.ADMIN], // Admin only
    children: [
      {
        title: 'المستخدمين',
        path: '/management/system/users/list',
        icon: <Icon icon="lucide:users" size={20} />,
      },
      {
        title: 'الفروع',
        path: '/management/system/branches/list',
        icon: <Icon icon="lucide:building" size={20} />,
      },
      {
        title: 'سجل النشاطات',
        path: '/management/system/audit',
        icon: <Icon icon="lucide:file-text" size={20} />,
      },
      {
        title: 'إعدادات التطبيق',
        path: '/management/system/app',
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

  return items
    .filter((item) => {
      // If item has roles requirement, check if user has required role
      if (item.roles && item.roles.length > 0) {
        return item.roles.includes(userRole);
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
