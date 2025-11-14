import { useAuth } from '@hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'إجمالي المبيعات اليوم',
      value: '45,230 ريال',
      change: '+12.5%',
      trend: 'up',
      icon: '💰',
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'عدد الطلبات',
      value: '248',
      change: '+8.2%',
      trend: 'up',
      icon: '📋',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'متوسط قيمة الطلب',
      value: '182 ريال',
      change: '+3.1%',
      trend: 'up',
      icon: '📊',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'الأصناف الناقصة',
      value: '12',
      change: '-5 عن الأمس',
      trend: 'down',
      icon: '⚠️',
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          مرحباً، {user?.name}
        </h1>
        <p className="text-gray-600">
          نظرة عامة على نشاط المطعم اليوم
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            آخر الطلبات
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">طلب #{1000 + i}</p>
                  <p className="text-sm text-gray-600">الطاولة {i}</p>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{120 + i * 20} ريال</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    مكتمل
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            الأصناف الأكثر مبيعاً
          </h2>
          <div className="space-y-3">
            {[
              { name: 'مندي دجاج', count: 45, revenue: '2,250 ريال' },
              { name: 'مندي لحم', count: 38, revenue: '3,040 ريال' },
              { name: 'كبسة دجاج', count: 32, revenue: '1,600 ريال' },
              { name: 'مظبي دجاج', count: 28, revenue: '1,400 ريال' },
              { name: 'عصير طازج', count: 95, revenue: '950 ريال' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.count} طلب</p>
                </div>
                <p className="font-medium text-primary-600">{item.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
