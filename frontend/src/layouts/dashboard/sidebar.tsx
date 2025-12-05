/**
 * Sidebar Navigation
 * Modern sidebar with shadcn/ui styling matching login page
 */

import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navData, getFilteredNavItems, isNavItemActive } from './nav/nav-data/nav-data-frontend';
import { useUserInfo } from '@/store/userStore';
import { useUnreadNotifications } from '@/hooks/queries/useNotifications';
import type { NavItem } from '#/router';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import GLOBAL_CONFIG from '@/global-config';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const user = useUserInfo();
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData || 0;

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
        'fixed right-0 top-0 h-screen w-[280px] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-[1000] overflow-y-auto transition-all duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src={GLOBAL_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">تراث المندي</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider">TURATH RESTAURANTS</p>
          </div>
        </div>

        {/* Close button - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
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
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group',
            isParentActive
              ? 'border-r-6 border-primary text-primary'
              : 'text-foreground hover:bg-accent'
          )}
        >
          {item.icon && (
            <span
              className={cn(
                'shrink-0 transition-transform group-hover:scale-110',
                isParentActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.icon}
            </span>
          )}
          <span className="flex-1 font-medium text-sm text-right">{item.title}</span>
          {item.info && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {item.info}
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180',
              isParentActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </button>

        {/* Children */}
        {isExpanded && (
          <ul className="mr-4 mt-1 space-y-1 border-r-2 border-border pr-2">
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
          'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group',
          depth > 0 && 'py-2 text-sm',
          isActive
            ? 'border-1 border-primary text-primary'
            : 'text-foreground hover:bg-accent'
        )}
      >
        {item.icon && (
          <span
            className={cn(
              'shrink-0 transition-transform group-hover:scale-110',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {item.icon}
          </span>
        )}
        <span className="flex-1 font-medium text-sm">{item.title}</span>
        {item.info && (
          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {item.info}
          </span>
        )}
      </NavLink>
    </li>
  );
}
