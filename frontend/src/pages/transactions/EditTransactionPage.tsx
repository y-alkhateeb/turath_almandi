/**
 * EditTransactionPage
 * Page for editing existing transactions
 *
 * Features:
 * - Uses UnifiedTransactionForm in edit mode
 * - Shows warning for multi-item transactions (cannot edit items)
 * - Loads transaction data and populates form
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Alert, AlertDescription } from '@/ui/alert';
import { PageLayout } from '@/components/layouts';
import UnifiedTransactionForm from '@/components/transactions/UnifiedTransactionForm';
import { useQuery } from '@tanstack/react-query';
import transactionService from '@/api/services/transactionService';

export const EditTransactionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => transactionService.getOne(id!),
    enabled: !!id,
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleSuccess = () => {
    navigate('/transactions');
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

  if (isLoading) {
    return (
      <PageLayout title="تعديل المعاملة" description="جاري التحميل...">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !transaction) {
    return (
      <PageLayout title="تعديل المعاملة" description="حدث خطأ">
        <Alert variant="destructive">
          <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'لم يتم العثور على المعاملة'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/transactions')}
          className="mt-4"
        >
          العودة للقائمة
        </Button>
      </PageLayout>
    );
  }

  // ============================================
  // RENDER EDIT FORM
  // ============================================

  const initialData = {
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    date: transaction.date.split('T')[0], // Convert to YYYY-MM-DD
    employeeVendorName: transaction.employeeVendorName,
    notes: transaction.notes,
    branchId: transaction.branchId,
    discountType: transaction.discountType,
    discountValue: transaction.discountValue,
    discountReason: transaction.discountReason,
    items: transaction.transactionInventoryItems?.map(item => ({
      inventoryItemId: item.inventoryItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      operationType: item.operationType,
      discountType: item.discountType,
      discountValue: item.discountValue,
    })) || [],
  };

  return (
    <PageLayout
      title="تعديل المعاملة"
      description={`تعديل ${transaction.type === 'INCOME' ? 'وارد' : 'مصروف'}`}
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      <Alert variant="info" className="mb-6">
        <Icon icon="solar:info-circle-bold" className="h-4 w-4" />
        <AlertDescription>
          يمكنك تعديل جميع تفاصيل المعاملة بما في ذلك الأصناف المتعددة.
        </AlertDescription>
      </Alert>

      <UnifiedTransactionForm
        type={transaction.type}
        initialData={initialData}
        isEditMode={true}
        transactionId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
};

export default EditTransactionPage;
