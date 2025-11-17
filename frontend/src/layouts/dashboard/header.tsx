/**
 * Dashboard Header
 * Top navigation bar with logo, user menu, and controls
 */

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Bell, Moon, Sun, User, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/logo';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearUserInfoAndToken();
    navigate('/login', { replace: true });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Modern User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 bg-brand-gold-500/10 backdrop-blur-md rounded-2xl border border-brand-gold-500/20 hover:border-brand-gold-500/50 hover:bg-brand-gold-500/20 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-brand-gold-500/20 group"
            >
              {/* User Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold-400 via-brand-gold-500 to-brand-gold-600 text-white font-bold flex items-center justify-center shadow-lg ring-2 ring-brand-gold-500/30 group-hover:ring-brand-gold-500/50 transition-all duration-300">
                  {(userInfo?.username || 'م').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-brand-green-600 dark:border-[#1a2d28]"></div>
              </div>

              {/* User Info - Hidden on mobile */}
              <div className="hidden md:flex flex-col items-start">
                <div className="text-sm font-semibold text-brand-cream-100 leading-tight">
                  {userInfo?.username || 'المستخدم'}
                </div>
                <div className="text-xs text-brand-gold-300 leading-tight">
                  {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                </div>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={`hidden md:block w-4 h-4 text-brand-cream-100 transition-transform duration-300 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-brand-green-500/10 to-brand-gold-500/10 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold-400 via-brand-gold-500 to-brand-gold-600 text-white font-bold flex items-center justify-center shadow-lg text-lg">
                      {(userInfo?.username || 'م').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                        {userInfo?.username || 'المستخدم'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-tight">
                        {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                      </p>
                      {userInfo?.branch && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Icon icon="solar:shop-2-bold-duotone" className="text-brand-gold-500" size={14} />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {userInfo.branch.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {/* Profile */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile page
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-gold-500/10 flex items-center justify-center group-hover:bg-brand-gold-500/20 transition-colors">
                      <User className="w-4 h-4 text-brand-gold-500" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium">الملف الشخصي</p>
                      <p className="text-xs text-[var(--text-secondary)]">عرض وتعديل معلوماتك</p>
                    </div>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to settings page
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-green-500/10 flex items-center justify-center group-hover:bg-brand-green-500/20 transition-colors">
                      <Settings className="w-4 h-4 text-brand-green-500" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium">الإعدادات</p>
                      <p className="text-xs text-[var(--text-secondary)]">تخصيص التطبيق</p>
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border-color)]"></div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-950/30 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium">تسجيل الخروج</p>
                      <p className="text-xs text-red-500/70 dark:text-red-400/70">الخروج من الحساب</p>
                    </div>
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
