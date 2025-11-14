import { Link, useLocation } from 'react-router';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'لوحة التحكم', path: '/dashboard', icon: '📊' },
  { name: 'المبيعات', path: '/sales', icon: '💰' },
  { name: 'المشتريات', path: '/purchases', icon: '🛒' },
  { name: 'المخزون', path: '/inventory', icon: '📦' },
  { name: 'التقارير', path: '/reports', icon: '📈' },
  { name: 'الإعدادات', path: '/settings', icon: '⚙️' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
