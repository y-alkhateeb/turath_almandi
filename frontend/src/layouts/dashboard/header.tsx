/**
 * Dashboard Header
 * Top navigation bar with logo, user menu, and controls
 */

import { Menu, LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
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
    <header className="fixed top-0 right-0 left-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Right Side: Menu + Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo (hidden on mobile when sidebar is visible) */}
          <Logo className="hidden md:flex" linkTo="/dashboard" />
        </div>

        {/* Left Side: Theme Toggle + User Menu */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
          >
            {themeMode === ThemeMode.Light ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex items-center gap-2">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium">{userInfo.username}</div>
                    <div className="text-xs text-gray-500">
                      {userInfo.role === 'ADMIN' ? 'مدير' : 'محاسب'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userInfo.username}</p>
                <p className="text-xs text-gray-500">
                  {userInfo.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                </p>
                {userInfo.branch && (
                  <p className="text-xs text-gray-500 mt-1">
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
