import { useState } from 'react';
import { DebtForm } from '../../components/DebtForm';
import { Modal } from '../../components/Modal';
import { PayDebtModal } from '../../components/PayDebtModal';
import { DebtPaymentHistory } from '../../components/DebtPaymentHistory';
import { useDebts } from '../../hooks/useDebts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { DebtStatus, type Debt } from '../../types/debts.types';

/**
 * Debts Page - Debt Management
 *
 * Features:
 * - List of all debts
 * - Add debt button with modal
 * - Integration with useDebts hook
 * - Loading and empty states
 * - Status badges (ACTIVE, PAID, PARTIAL)
 * - Overdue indicator
 * - Arabic interface
 */
export const DebtsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const { data: debts, isLoading, error } = useDebts();

  const handleSuccess = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedDebt(null);
  };

  const toggleExpandDebt = (debtId: string) => {
    setExpandedDebtId(expandedDebtId === debtId ? null : debtId);
  };

  const formatStatus = (status: DebtStatus) => {
    const statusMap = {
      ACTIVE: 'نشط',
      PAID: 'مدفوع',
      PARTIAL: 'مدفوع جزئيًا',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: DebtStatus) => {
    const colorMap = {
      ACTIVE: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate: string, status: DebtStatus) => {
    if (status === DebtStatus.PAID) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الديون</h1>
            <p className="mt-2 text-gray-600">إدارة جميع الديون والذمم</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة دين
          </button>
        </div>
      </div>

      {/* Debt Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="إضافة دين جديد"
        size="lg"
      >
        <DebtForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Modal>

      {/* Pay Debt Modal */}
      <PayDebtModal
        isOpen={isPayModalOpen}
        onClose={handleClosePayModal}
        debt={selectedDebt}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="جاري التحميل..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="danger" title="خطأ">
          حدث خطأ أثناء تحميل البيانات
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && debts && debts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12">
          <EmptyState
            icon={
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="لا توجد ديون"
            description="ابدأ بإضافة أول دين"
            action={{
              label: 'إضافة دين جديد',
              onClick: () => setIsModalOpen(true),
            }}
          />
        </div>
      )}

      {/* Debts Table */}
      {!isLoading && !error && debts && debts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  اسم الدائن
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  المبلغ الأصلي
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  المبلغ المدفوع
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  المبلغ المتبقي
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  تاريخ الاستحقاق
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  الفرع
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {debts.map((debt) => {
                const overdueFlag = isOverdue(debt.dueDate, debt.status);
                const isExpanded = expandedDebtId === debt.id;
                const paidAmount = debt.originalAmount - debt.remainingAmount;
                const hasPayments = debt.payments && debt.payments.length > 0;

                return (
                  <>
                    <tr
                      key={debt.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        overdueFlag ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {hasPayments && (
                            <button
                              onClick={() => toggleExpandDebt(debt.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={isExpanded ? 'إخفاء السجل' : 'عرض السجل'}
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          )}
                          <span>{debt.creditorName}</span>
                          {overdueFlag && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              متأخر
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        ${debt.originalAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600" dir="ltr">
                        ${paidAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600" dir="ltr">
                        ${debt.remainingAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(debt.date).toLocaleDateString('ar-IQ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(debt.dueDate).toLocaleDateString('ar-IQ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            debt.status
                          )}`}
                        >
                          {formatStatus(debt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.branch?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {debt.status !== DebtStatus.PAID && (
                            <button
                              onClick={() => handlePayDebt(debt)}
                              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 ml-1"
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
                              دفع
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row - Payment History */}
                    {isExpanded && hasPayments && (
                      <tr key={`${debt.id}-expanded`}>
                        <td colSpan={9} className="px-6 py-4 bg-gray-50">
                          <DebtPaymentHistory payments={debt.payments || []} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && !error && debts && debts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Active Debts */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">إجمالي الديون النشطة</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2" dir="ltr">
                  $
                  {debts
                    .filter((d) => d.status === DebtStatus.ACTIVE)
                    .reduce((sum, d) => sum + Number(d.remainingAmount), 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
              <div className="bg-yellow-200 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-700"
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
              </div>
            </div>
          </div>

          {/* Total Debts */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">إجمالي جميع الديون</p>
                <p className="text-2xl font-bold text-blue-900 mt-2" dir="ltr">
                  $
                  {debts
                    .reduce((sum, d) => sum + Number(d.remainingAmount), 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Overdue Debts Count */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">عدد الديون المتأخرة</p>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {debts.filter((d) => isOverdue(d.dueDate, d.status)).length}
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-red-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
