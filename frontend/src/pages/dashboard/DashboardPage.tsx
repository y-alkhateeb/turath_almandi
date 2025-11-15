import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBranches } from '../../hooks/useBranches';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { FinancialCard } from '../../components/dashboard/FinancialCard';

/**
 * Dashboard Page Component
 *
 * Features:
 * - Financial summary with income/expense breakdown
 * - Date filter (defaults to today)
 * - Branch filter (admin only)
 * - Auto-refresh when filters change
 * - Loading states
 * - RTL layout with Arabic text
 * - Modern card design with color coding
 */
export const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Fetch branches for admin users
  const { data: branches } = useBranches({ enabled: isAdmin() });

  // Fetch dashboard summary with current filters
  const { data: summary, isLoading, error } = useDashboardSummary({
    date: selectedDate,
    branchId: selectedBranchId || undefined,
  });

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Handle branch change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranchId(e.target.value);
  };

  // Set date to today
  const handleTodayClick = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-arabic">
            لوحة التحكم المالية
          </h1>
          <p className="text-gray-600 font-arabic">
            ملخص الوضع المالي للمطعم
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">
                التاريخ
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleTodayClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-arabic"
                >
                  اليوم
                </button>
              </div>
            </div>

            {/* Branch Filter (Admin Only) */}
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">
                  الفرع
                </label>
                <select
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">جميع الفروع</option>
                  {branches?.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600 font-arabic">
                <span className="font-medium">المستخدم: </span>
                {user?.username}
                <br />
                <span className="font-medium">الدور: </span>
                {user?.role === 'ADMIN' ? 'مدير' : 'محاسب'}
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-arabic">
              حدث خطأ أثناء تحميل البيانات: {error.message}
            </p>
          </div>
        )}

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Income Card */}
          <FinancialCard
            title="إجمالي الدخل"
            value={summary?.total_income || 0}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="green"
            breakdown={[
              { label: 'نقدي', value: summary?.income_cash || 0 },
              { label: 'ماستر كارد', value: summary?.income_master || 0 },
            ]}
            isLoading={isLoading}
          />

          {/* Total Expense Card */}
          <FinancialCard
            title="إجمالي المصروفات"
            value={summary?.total_expense || 0}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            color="red"
            isLoading={isLoading}
          />

          {/* Net Profit/Loss Card */}
          <FinancialCard
            title="الصافي"
            value={summary?.net || 0}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            color={(summary?.net || 0) >= 0 ? 'blue' : 'purple'}
            isLoading={isLoading}
          />
        </div>

        {/* Summary Info */}
        {summary && !isLoading && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-arabic">
              معلومات الملخص
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-arabic">التاريخ: </span>
                <span className="font-semibold text-gray-900">
                  {new Date(summary.date).toLocaleDateString('ar-IQ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {summary.branchId && (
                <div>
                  <span className="text-gray-600 font-arabic">الفرع: </span>
                  <span className="font-semibold text-gray-900">
                    {branches?.find((b) => b.id === summary.branchId)?.name || 'غير معروف'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600 font-arabic">الحالة: </span>
                <span
                  className={`font-semibold ${
                    summary.net >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {summary.net >= 0 ? 'ربح' : 'خسارة'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && summary && summary.total_income === 0 && summary.total_expense === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-yellow-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-yellow-700 font-semibold font-arabic mb-2">
              لا توجد معاملات لهذا التاريخ
            </p>
            <p className="text-yellow-600 text-sm font-arabic">
              لم يتم تسجيل أي دخل أو مصروفات في التاريخ المحدد
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
