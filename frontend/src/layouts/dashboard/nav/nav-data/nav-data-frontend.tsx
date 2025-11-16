/**
 * Navigation Data Configuration (Frontend Mode)
 * Arabic menu structure for the application
 */

import { Icon } from '@/components/icon';
import type { NavItem } from '#/router';
import { UserRole } from '#/enum';

export const navData: NavItem[] = [
  {
    title: 'لوحة التحكم',
    path: '/dashboard',
    icon: <Icon icon="solar:pie-chart-2-bold-duotone" size={24} />,
  },
  {
    title: 'المعاملات',
    path: '/transactions',
    icon: <Icon icon="solar:bill-list-bold-duotone" size={24} />,
  },
  {
    title: 'الديون',
    path: '/debts',
    icon: <Icon icon="solar:wallet-money-bold-duotone" size={24} />,
  },
  {
    title: 'المخزون',
    path: '/inventory',
    icon: <Icon icon="solar:box-bold-duotone" size={24} />,
  },
  {
    title: 'الفروع',
    path: '/branches',
    icon: <Icon icon="solar:shop-2-bold-duotone" size={24} />,
    roles: [UserRole.ADMIN], // Admin only
  },
  {
    title: 'المستخدمين',
    path: '/users',
    icon: <Icon icon="solar:users-group-rounded-bold-duotone" size={24} />,
    roles: [UserRole.ADMIN], // Admin only
  },
];
