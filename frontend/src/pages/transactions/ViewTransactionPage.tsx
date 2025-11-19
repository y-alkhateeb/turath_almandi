import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Edit } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
import { TransactionType, PaymentMethod } from '@/types/transactions.types';

/**
 * View Transaction Page
 * Full page for viewing transaction details
 */
export const ViewTransactionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: transactions = [], isLoading } = useTransactions();

  // Find the transaction to view
  const transaction = transactions.find((t) => t.id === id);

  const handleCancel = () => {
    navigate('/transactions');
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

  if (!transaction) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">لم يتم العثور على العملية المطلوبة</Alert>
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
      <div className="flex items-center justify-between">
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
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
        >
          <Edit className="w-4 h-4" />
          تعديل
        </Button>
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
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
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
                <span className="font-semibold">{formatAmount(transaction.amount)} IQD</span>
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
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="font-medium text-blue-900">
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

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ViewTransactionPage;
