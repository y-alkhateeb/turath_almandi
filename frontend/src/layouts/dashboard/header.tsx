/**
 * Dashboard Header
 * Top navigation bar with logo, user menu, and controls
 */

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Bell, Moon, Sun, User, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserInfo, useUserActions } from '@/store/userStore';
import { useTheme } from '@/theme/hooks';
import { ThemeMode } from '@/theme/type';
import { Icon } from '@/components/icon';
import { useUnreadNotifications } from '@/hooks/queries/useNotifications';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const { clearAuth } = useUserActions();
  const { themeMode, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Get unread notifications count
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData?.count || 0;

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
    <header className="sticky top-0 z-[100] bg-gradient-to-r from-brand-green-500 to-brand-green-600 dark:from-[#1a2d28] dark:to-[#152420] border-b-2 border-brand-gold-500/30 dark:border-brand-gold-400/30 shadow-lg transition-all duration-300">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes rotateIn {
          from {
            transform: rotate(-180deg) scale(0);
            opacity: 0;
          }
          to {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        .dropdown-menu {
          animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .menu-item-1 {
          animation: fadeInUp 0.3s ease-out 0.05s both;
        }

        .menu-item-2 {
          animation: fadeInUp 0.3s ease-out 0.1s both;
        }

        .menu-item-3 {
          animation: fadeInUp 0.3s ease-out 0.15s both;
        }

        .online-indicator {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .avatar-gradient {
          background-size: 200% 200%;
          animation: shimmer 3s linear infinite;
          background-image: linear-gradient(
            90deg,
            #d4af77 0%,
            #f5d895 25%,
            #d4af77 50%,
            #c5a572 75%,
            #d4af77 100%
          );
        }

        .icon-float:hover {
          animation: float 0.6s ease-in-out infinite;
        }

        .icon-rotate {
          animation: rotateIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

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
          <h1 className="text-xl md:text-2xl font-bold text-brand-cream-100">لوحة التحكم</h1>
        </div>

        {/* Left Side: Theme Toggle + Notifications + User Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-xl bg-brand-gold-500/20 backdrop-blur-sm text-brand-cream-100 hover:bg-brand-gold-500 hover:scale-110 hover:rotate-12 transition-all duration-300 shadow-md hover:shadow-gold-glow flex items-center justify-center border border-brand-gold-500/30"
            title={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
            aria-label={themeMode === ThemeMode.Light ? 'الوضع الداكن' : 'الوضع الفاتح'}
          >
            {themeMode === ThemeMode.Light ? (
              <Moon className="w-5 h-5 transition-transform duration-300" />
            ) : (
              <Sun className="w-5 h-5 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-11 h-11 rounded-xl bg-brand-gold-500/20 backdrop-blur-sm border border-brand-gold-500/30 text-brand-cream-100 hover:bg-brand-gold-500 hover:scale-105 transition-all flex items-center justify-center group"
              aria-label="الإشعارات"
            >
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>

          {/* Modern User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 bg-brand-gold-500/10 backdrop-blur-md rounded-2xl border border-brand-gold-500/20 hover:border-brand-gold-500/50 hover:bg-brand-gold-500/20 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-brand-gold-500/20 hover:scale-[1.02] group"
            >
              {/* User Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full avatar-gradient text-white font-bold flex items-center justify-center shadow-lg ring-2 ring-brand-gold-500/30 group-hover:ring-brand-gold-500/60 group-hover:ring-4 transition-all duration-300 group-hover:scale-105">
                  {(userInfo?.username || 'م').charAt(0).toUpperCase()}
                </div>
                <div className="online-indicator absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-brand-green-600 dark:border-[#1a2d28] shadow-lg"></div>
              </div>

              {/* User Info - Hidden on mobile */}
              <div className="hidden md:flex flex-col items-start">
                <div className="text-sm font-semibold text-brand-cream-100 leading-tight group-hover:text-white transition-colors">
                  {userInfo?.username || 'المستخدم'}
                </div>
                <div className="text-xs text-brand-gold-300 leading-tight group-hover:text-brand-gold-200 transition-colors">
                  {userInfo?.role === 'ADMIN' ? 'مدير النظام' : 'محاسب'}
                </div>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={`hidden md:block w-4 h-4 text-brand-cream-100 transition-all duration-500 ease-out ${
                  isUserMenuOpen ? 'rotate-180 scale-110' : 'rotate-0'
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="dropdown-menu absolute left-0 mt-2 w-72 bg-[var(--bg-secondary)]/95 backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-50">
                {/* Animated gradient border overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-gold-500/20 via-brand-green-500/20 to-brand-gold-500/20 animate-pulse pointer-events-none"></div>

                {/* User Info Header */}
                <div className="relative px-4 py-4 bg-gradient-to-r from-brand-green-500/10 to-brand-gold-500/10 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full avatar-gradient text-white font-bold flex items-center justify-center shadow-lg text-lg icon-rotate ring-2 ring-brand-gold-400/50">
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
                          <Icon
                            icon="solar:shop-2-bold-duotone"
                            className="text-brand-gold-500 icon-float"
                            size={14}
                          />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {userInfo.branch.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2 relative">
                  {/* Profile */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile page
                    }}
                    className="menu-item-1 w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 group hover:pr-5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-gold-500/10 flex items-center justify-center group-hover:bg-brand-gold-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <User className="w-4 h-4 text-brand-gold-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium group-hover:text-brand-gold-500 transition-colors">
                        الملف الشخصي
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                        عرض وتعديل معلوماتك
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 -rotate-90 transition-all duration-300" />
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to settings page
                    }}
                    className="menu-item-2 w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 group hover:pr-5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-green-500/10 flex items-center justify-center group-hover:bg-brand-green-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Settings className="w-4 h-4 text-brand-green-500 group-hover:rotate-90 group-hover:scale-110 transition-all duration-500" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium group-hover:text-brand-green-500 transition-colors">
                        الإعدادات
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                        تخصيص التطبيق
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 -rotate-90 transition-all duration-300" />
                  </button>
                </div>

                {/* Animated Divider */}
                <div className="relative border-t border-[var(--border-color)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold-500/30 to-transparent h-px"></div>
                </div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="menu-item-3 w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-300 group hover:pr-5 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-950/40 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                      <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                        تسجيل الخروج
                      </p>
                      <p className="text-xs text-red-500/70 dark:text-red-400/70 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                        الخروج من الحساب
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 -rotate-90 transition-all duration-300 text-red-600" />
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
