import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';
import { useTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
import { TransactionType, PaymentMethod } from '@/types/transactions.types';
import { useState } from 'react';

/**
 * View Transaction Page
 * Full page for viewing transaction details
 */
export const ViewTransactionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: transaction, isLoading, error } = useTransaction(id || '');
  const deleteTransaction = useDeleteTransaction();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCancel = () => {
    navigate('/transactions');
  };

  const handleDelete = async () => {
    if (!transaction) return;
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      navigate('/transactions');
    } catch (error) {
      // Error is handled by the mutation
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return '-';
    return method === 'CASH' ? 'نقدي' : 'ماستر کارد';
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات العملية..." />;
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          {error?.message || 'لم يتم العثور على العملية المطلوبة'}
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى العمليات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">تفاصيل العملية</h1>
            <p className="text-[var(--text-secondary)] mt-1">عرض تفاصيل العملية المالية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </div>
      </div>

      {/* Transaction Details Card */}
      <Card padding="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                نوع العملية
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                <span
                  className={`font-semibold ${
                    transaction.type === 'INCOME'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {getTypeLabel(transaction.type)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                المبلغ
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatAmount(transaction.amount)} {transaction.currency}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                التاريخ
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {formatDate(transaction.date)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                طريقة الدفع
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                الفئة
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {transaction.category || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {transaction.type === 'INCOME' ? 'اسم العميل' : 'اسم الموظف/المورد'}
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {transaction.employeeVendorName || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                الفرع
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {transaction.branch?.name || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                أنشئ بواسطة
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {transaction.creator?.username || '-'}
              </div>
            </div>

            {transaction.inventoryItem && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  مرتبط بالمخزون
                </label>
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    {transaction.inventoryItem.name} ({transaction.inventoryItem.quantity}{' '}
                    {transaction.inventoryItem.unit})
                  </span>
                </div>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                ملاحظات
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md min-h-[80px]">
                {transaction.notes}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
            <Button variant="ghost" onClick={handleCancel}>
              إغلاق
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">تأكيد الحذف</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteTransaction.isPending}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteTransaction.isPending}
              >
                {deleteTransaction.isPending ? 'جاري الحذف...' : 'حذف'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTransactionPage;
