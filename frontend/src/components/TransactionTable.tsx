import { useState } from 'react';
import type {
  Transaction,
  TransactionType,
  PaymentMethod,
  TransactionFilters,
  PaginationMeta,
} from '../types/transactions.types';
import { useAuth } from '../hooks/useAuth';

interface TransactionTableProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  isLoading?: boolean;
}

export default function TransactionTable({
  transactions,
  pagination,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: TransactionTableProps) {
  const { user, isAdmin } = useAuth();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput, page: 1 });
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getTypeLabel = (type: TransactionType) => {
    return type === 'INCOME' ? 'إيراد' : 'مصروف';
  };

  const getTypeColor = (type: TransactionType) => {
    return type === 'INCOME' ? 'text-green-600' : 'text-red-600';
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return '-';
    return method === 'CASH' ? 'نقدي' : 'ماستر کارد';
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">الفلاتر والبحث</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">البحث</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث في الاسم، الفئة، أو الملاحظات..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                بحث
              </button>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    onFiltersChange({ ...filters, search: undefined, page: 1 });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </form>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">نوع العملية</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="INCOME">إيراد</option>
              <option value="EXPENSE">مصروف</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
            <select
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="CASH">نقدي</option>
              <option value="MASTER">ماستر کارد</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">الفئة</label>
            <input
              type="text"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              placeholder="الفئة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ page: 1, limit: filters.limit });
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              مسح جميع الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ (IQD)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفرع
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="mr-3">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                    لا توجد عمليات
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeLabel(transaction.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.employeeVendorName || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.branch?.name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onView(transaction)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          title="عرض التفاصيل"
                        >
                          عرض
                        </button>
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-green-600 hover:text-green-800 font-medium"
                          title="تعديل"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDelete(transaction)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="حذف"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && transactions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              عرض {(pagination.page - 1) * pagination.limit + 1} إلى{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} من{' '}
              {pagination.total} عملية
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
