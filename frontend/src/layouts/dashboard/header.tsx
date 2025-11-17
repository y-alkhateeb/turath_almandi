/**
 * Dashboard Header
 * Top navigation bar with logo, user menu, and controls
 */

import { Menu, LogOut, Bell, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { Button } from '@/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { useUserInfo, useUserActions } from '@/store/userStore';
import { useTheme } from '@/theme/hooks';
import { ThemeMode } from '@/theme/type';
import { Icon } from '@/components/icon';

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const { clearUserInfoAndToken } = useUserActions();
  const { themeMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearUserInfoAndToken();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-[100] bg-gradient-to-r from-brand-green-500 to-brand-green-600 dark:from-[#1a2d28] dark:to-[#152420] border-b-2 border-brand-gold-500/30 dark:border-brand-gold-400/30 shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 h-[76px]">
        {/* Right Side: Mobile Menu + Title */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-brand-gold-500/20 hover:bg-brand-gold-500 hover:text-white transition-all backdrop-blur-sm"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6 text-brand-cream-100" />
          </button>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-brand-cream-100">
            لوحة التحكم
          </h1>
        </div>

        {/* Left Side: Theme Toggle + Notifications + User Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-xl bg-brand-gold-500/20 backdrop-blur-sm text-brand-cream-100 hover:bg-brand-gold-500 hover:scale-110 hover:rotate-15 transition-all shadow-md hover:shadow-gold-glow flex items-center justify-center border border-brand-gold-500/30"
            title={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
            aria-label={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
          >
            {themeMode === ThemeMode.Light ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative w-11 h-11 rounded-xl bg-brand-gold-500/20 backdrop-blur-sm border border-brand-gold-500/30 text-brand-cream-100 hover:bg-brand-gold-500 hover:scale-105 transition-all flex items-center justify-center"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
              5
            </span>
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 pr-2 bg-brand-gold-500/20 backdrop-blur-sm rounded-xl border-2 border-brand-gold-500/30 hover:border-brand-gold-500 cursor-pointer transition-all hover:shadow-md">
                <div className="hidden md:flex flex-col items-start">
                  <div className="text-sm font-bold text-brand-cream-100">
                    {userInfo?.username || 'المستخدم'}
                  </div>
                  <div className="text-xs text-brand-gold-300">
                    {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold-500 to-brand-gold-300 text-white font-bold flex items-center justify-center shadow-lg">
                  {(userInfo?.username || 'م').charAt(0)}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userInfo?.username || 'المستخدم'}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                </p>
                {userInfo?.branch && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    <Icon icon="solar:shop-2-linear" className="inline ml-1" size={12} />
                    {userInfo.branch.name}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
