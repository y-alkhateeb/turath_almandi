/**
 * Sidebar Navigation
 * Vertical navigation menu with mobile drawer support
 */

import { X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/logo';
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
          <p className="text-xs text-brand-gold-300 mt-1 tracking-widest">
            TURATH RESTAURANTS
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-6 border-t border-brand-gold-500/20 dark:border-brand-gold-400/30">
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
          'flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all relative overflow-hidden group',
          isActive
            ? 'bg-gradient-to-r from-brand-gold-500/30 to-brand-gold-500/15 text-brand-cream-100 border-r-4 border-brand-gold-500 dark:border-brand-gold-300 shadow-lg dark:shadow-gold-glow font-semibold'
            : 'text-brand-cream-100 hover:bg-brand-gold-500/15 hover:translate-x-[-5px] hover:pr-5'
        )}
      >
        {item.icon && (
          <span className={cn(
            'shrink-0 group-hover:scale-110 transition-transform',
            isActive ? 'text-brand-cream-100' : 'text-brand-cream-200'
          )}>
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
