/**
 * Sidebar Navigation
 * Vertical navigation menu with mobile drawer support
 */

import { X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { Button } from '@/ui/button';
import { cn } from '@/utils';
import { navData } from './nav/nav-data/nav-data-frontend';
import { AuthGuard } from '@/components/auth/auth-guard';
import type { NavItem } from '#/router';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-64 transform bg-brand-green-600 border-l border-brand-green-700 transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-brand-green-700">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-brand-cream-100 hover:text-white hover:bg-brand-green-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navData.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                onClick={onClose}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavigationItem({ item, isActive, onClick }: NavigationItemProps) {
  // Check if item should be rendered based on roles
  if (item.roles && item.roles.length > 0) {
    return (
      <AuthGuard roles={item.roles}>
        <NavigationItemContent item={item} isActive={isActive} onClick={onClick} />
      </AuthGuard>
    );
  }

  return <NavigationItemContent item={item} isActive={isActive} onClick={onClick} />;
}

function NavigationItemContent({ item, isActive, onClick }: NavigationItemProps) {
  return (
    <li>
      <NavLink
        to={item.path!}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-gold-500 text-white'
            : 'text-brand-cream-100 hover:bg-brand-green-700 hover:text-white'
        )}
      >
        {item.icon && (
          <span className={cn(isActive ? 'text-white' : 'text-brand-cream-200')}>
            {item.icon}
          </span>
        )}
        <span>{item.title}</span>
        {item.info && (
          <span className="mr-auto text-xs bg-brand-gold-400 text-white px-2 py-0.5 rounded-full">
            {item.info}
          </span>
        )}
      </NavLink>
    </li>
  );
}
