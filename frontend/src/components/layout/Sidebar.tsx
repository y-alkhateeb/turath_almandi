import { Link, useLocation } from 'react-router';
import {
  Home,
  DollarSign,
  Building,
  Users,
  Package,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'لوحة التحكم', path: '/dashboard', icon: Home },
  { name: 'العمليات المالية', path: '/transactions', icon: DollarSign },
  { name: 'الفروع', path: '/branches', icon: Building },
  { name: 'المستخدمين', path: '/users', icon: Users },
  { name: 'المخزون', path: '/inventory', icon: Package },
  { name: 'التقارير', path: '/reports', icon: FileText },
  { name: 'الإعدادات', path: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Overlay - Mobile/Tablet only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-white border-l border-gray-200',
          // Desktop: static, always visible
          'lg:static lg:translate-x-0',
          // Mobile/Tablet: fixed overlay, slide in from right
          'fixed top-16 right-0 bottom-0 z-50',
          'transition-transform duration-200',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-2 overflow-y-auto h-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
