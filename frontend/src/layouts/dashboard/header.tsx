/**
 * Dashboard Header
 * Modern header with shadcn/ui styling matching login page
 */

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Bell, Moon, Sun, ChevronDown, User, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserInfo, useUserActions } from '@/store/userStore';
import { useTheme } from '@/theme/hooks';
import { ThemeMode } from '@/theme/type';
import { useUnreadNotifications } from '@/hooks/queries/useNotifications';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Page titles mapping - supports exact match and pattern matching
const pageTitles: Record<string, string> = {
  '/': 'لوحة التحكم',
  '/dashboard': 'لوحة التحكم',
  '/transactions': 'المعاملات',
  '/transactions/create/expense': 'إضافة مصروف',
  '/transactions/create/income': 'إضافة إيراد',
  '/contacts': 'جهات الاتصال',
  '/inventory': 'المخزون',
  '/employees': 'إدارة الموظفين',
  '/management/payables/list': 'الذمم الدائنة',
  '/management/receivables/list': 'الذمم المدينة',
  '/settings': 'الإعدادات',
  '/notifications': 'الإشعارات',
};

// Pattern-based titles for dynamic routes
const patternTitles: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/employees\/[^/]+$/, title: 'تفاصيل الموظف' },
  { pattern: /^\/transactions\/[^/]+$/, title: 'تفاصيل المعاملة' },
];

/**
 * Get page title based on pathname
 * Supports exact match and pattern matching for dynamic routes
 */
function getPageTitle(pathname: string): string {
  // Check exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check pattern matches
  for (const { pattern, title } of patternTitles) {
    if (pattern.test(pathname)) {
      return title;
    }
  }

  // Default
  return 'لوحة التحكم';
}

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useUserInfo();
  const { clearAuth } = useUserActions();
  const { themeMode, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Get page title based on current path
  const pageTitle = getPageTitle(location.pathname);

  // Get unread notifications count
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData || 0;

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[100] bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 h-16">
        {/* Right Side: Mobile Menu + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Left Side: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-accent"
            title={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
          >
            {themeMode === ThemeMode.Light ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="rounded-full hover:bg-accent relative"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-xs font-bold min-w-5 h-5 flex items-center justify-center rounded-full px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                'flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-full',
                'bg-muted hover:bg-accent transition-all duration-200',
                'border border-transparent hover:border-border'
              )}
            >
              {/* User Avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-sm">
                  {(userInfo?.username || 'م').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-card" />
              </div>

              {/* User Info - Hidden on mobile */}
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">
                  {userInfo?.username || 'المستخدم'}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                </span>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  'hidden md:block w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isUserMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                      {(userInfo?.username || 'م').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {userInfo?.username || 'المستخدم'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>الملف الشخصي</span>
                  </button>

                  {userInfo?.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>الإعدادات</span>
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Logout */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
