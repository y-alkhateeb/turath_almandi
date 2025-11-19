/**
 * Sidebar Navigation
 * Vertical navigation menu with mobile drawer support
 * Features:
 * - Role-based menu filtering
 * - Unread notifications badge
 * - Active state highlighting
 * - RTL support
 * - Nested navigation items
 */

import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { navData, getFilteredNavItems, isNavItemActive } from './nav/nav-data/nav-data-frontend';
import { useUserInfo } from '@/store/userStore';
import { useUnreadNotifications } from '@/hooks/queries/useNotifications';
import type { NavItem } from '#/router';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const user = useUserInfo();
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData?.count || 0;

  // Filter nav items based on user role
  const filteredNavData = getFilteredNavItems(navData, user?.role);

  // Add unread badge to notifications item
  const navDataWithBadge = filteredNavData.map((item) => {
    if (item.path === '/notifications' && unreadCount > 0) {
      return {
        ...item,
        info: unreadCount > 99 ? '99+' : String(unreadCount),
      };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-screen w-[280px] bg-gradient-to-b from-brand-green-500 to-brand-green-700 dark:from-[#1a2d28] dark:to-[#0f1a16] border-l border-brand-gold-500/20 dark:border-brand-gold-400/30 shadow-2xl z-[1000] overflow-y-auto transition-all duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo Section - Integrates with Header */}
      <div className="h-[76px] flex items-center justify-center px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-cream-100 to-brand-gold-300 bg-clip-text text-transparent">
            تراث المندي
          </h1>
          <p className="text-xs text-brand-gold-300 mt-1 tracking-widest">TURATH RESTAURANTS</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-6 border-t border-brand-gold-500/20 dark:border-brand-gold-400/30">
        <ul className="space-y-1">
          {navDataWithBadge.map((item, index) => (
            <NavigationItem
              key={item.path || `nav-item-${index}`}
              item={item}
              currentPath={location.pathname}
              onClick={onClose}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

interface NavigationItemProps {
  item: NavItem;
  currentPath: string;
  onClick: () => void;
  depth?: number;
}

function NavigationItem({ item, currentPath, onClick, depth = 0 }: NavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if this item or its children are active
    return isNavItemActive(item, currentPath);
  });

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === currentPath;
  const isParentActive = item.children?.some((child) => child.path === currentPath);

  // Parent item with children
  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all relative overflow-hidden group',
            isParentActive
              ? 'bg-gradient-to-r from-brand-gold-500/30 to-brand-gold-500/15 text-brand-cream-100 border-r-4 border-brand-gold-500 dark:border-brand-gold-300 shadow-lg dark:shadow-gold-glow font-semibold'
              : 'text-brand-cream-100 hover:bg-brand-gold-500/15 hover:translate-x-[-5px] hover:pr-5'
          )}
        >
          {item.icon && (
            <span
              className={cn(
                'shrink-0 group-hover:scale-110 transition-transform',
                isParentActive ? 'text-brand-cream-100' : 'text-brand-cream-200'
              )}
            >
              {item.icon}
            </span>
          )}
          <span className="flex-1 font-medium text-right">{item.title}</span>
          {item.info && (
            <span className="bg-gradient-to-br from-brand-gold-500 to-brand-gold-700 dark:from-brand-gold-300 dark:to-brand-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
              {item.info}
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
        </button>

        {/* Children */}
        {isExpanded && (
          <ul className="mr-4 mt-1 space-y-1 border-r-2 border-brand-gold-500/20 pr-2">
            {item.children!.map((child, index) => (
              <NavigationItem
                key={child.path || `child-${index}`}
                item={child}
                currentPath={currentPath}
                onClick={onClick}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Leaf item (no children)
  if (!item.path) {
    return null;
  }

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all relative overflow-hidden group',
          depth > 0 && 'py-2 text-sm', // Smaller padding for nested items
          isActive
            ? 'bg-gradient-to-r from-brand-gold-500/30 to-brand-gold-500/15 text-brand-cream-100 border-r-4 border-brand-gold-500 dark:border-brand-gold-300 shadow-lg dark:shadow-gold-glow font-semibold'
            : 'text-brand-cream-100 hover:bg-brand-gold-500/15 hover:translate-x-[-5px] hover:pr-5'
        )}
      >
        {item.icon && (
          <span
            className={cn(
              'shrink-0 group-hover:scale-110 transition-transform',
              isActive ? 'text-brand-cream-100' : 'text-brand-cream-200'
            )}
          >
            {item.icon}
          </span>
        )}
        <span className="flex-1 font-medium">{item.title}</span>
        {item.info && (
          <span className="bg-gradient-to-br from-brand-gold-500 to-brand-gold-700 dark:from-brand-gold-300 dark:to-brand-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            {item.info}
          </span>
        )}
      </NavLink>
    </li>
  );
}
