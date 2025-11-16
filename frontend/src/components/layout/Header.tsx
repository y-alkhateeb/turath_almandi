import { useAuth } from '@/hooks/useAuth';
import { Menu, Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-4 lg:px-6">
        <div className="h-full flex items-center justify-between">
          {/* Right Side: Menu Button (Mobile) + Logo */}
          <div className="flex items-center gap-3">
            {/* Menu Button - Mobile Only */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                ت
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">تراث المندي</h1>
              </div>
            </div>
          </div>

          {/* Left Side: Notifications + User Menu */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button
              className="hidden md:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Logout Button - Desktop */}
            <button
              onClick={logout}
              className="hidden lg:block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
