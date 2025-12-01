/**
 * ViewTransactionDetailPage
 * Enhanced transaction detail view
 *
 * Features:
 * - Transaction summary card with all details
 * - Multi-item details section (expandable)
 * - Linked debt information card
 * - Audit trail section
 * - Actions: edit, delete, back
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Alert, AlertDescription } from '@/ui/alert';
import { cn } from '@/utils';
import { PageLayout } from '@/components/layouts';
import { ConfirmDeleteDialog } from '@/components/dialogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import transactionService from '@/api/services/transactionService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// ============================================
// CATEGORY CONFIG
// ============================================

const CATEGORY_LABELS: Record<string, string> = {
  INVENTORY_SALES: 'مبيعات المخزون',
  CAPITAL_ADDITION: 'إضافة رأس مال',
  APP_PURCHASES: 'مشتريات التطبيق',
  DEBT_PAYMENT: 'سداد دين',
  EMPLOYEE_SALARIES: 'رواتب الموظفين',
  WORKER_DAILY: 'أجور عمال يومية',
  SUPPLIES: 'لوازم',
  MAINTENANCE: 'صيانة',
  INVENTORY: 'مخزون',
  DEBT: 'دين',
  CASHIER_SHORTAGE: 'عجز صندوق',
  RETURNS: 'مرتجعات',
  OTHER_EXPENSE: 'مصروفات أخرى',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'تحويل بنكي',
  CARD: 'بطاقة',
  CHEQUE: 'شيك',
};

// ============================================
// COMPONENT
// ============================================

export default function ViewTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => transactionService.getOne(id!),
    enabled: !!id,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const deleteMutation = useMutation({
    mutationFn: () => transactionService.deleteTransaction(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success('تم حذف المعاملة بنجاح');

      navigate('/transactions');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleEdit = () => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

  if (isLoading) {
    return (
      <PageLayout title="تفاصيل المعاملة" description="جاري التحميل...">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !transaction) {
    return (
      <PageLayout title="تفاصيل المعاملة" description="حدث خطأ">
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
  // COMPUTED VALUES
  // ============================================

  const isIncome = transaction.type === 'INCOME';
  const hasMultipleItems = (transaction.transactionInventoryItems?.length || 0) > 0;
  const hasDebt = !!transaction.debtId;

  // ============================================
  // RENDER
  // ============================================

  return (
    <PageLayout
      title="تفاصيل المعاملة"
      description={`${isIncome ? 'وارد' : 'مصروف'} - ${format(new Date(transaction.date), 'dd MMMM yyyy', { locale: ar })}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            <Icon icon="solar:arrow-right-linear" className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Icon icon="solar:pen-bold" className="w-4 h-4 ml-2" />
            تعديل
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Icon icon="solar:trash-bin-minimalistic-bold" className="w-4 h-4 ml-2" />
            حذف
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Transaction Summary Card */}
        <Card className={cn(
          'border-r-4',
          isIncome ? 'border-r-green-500' : 'border-r-red-500'
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>معلومات المعاملة</span>
              <Badge variant={isIncome ? 'success' : 'destructive'}>
                {isIncome ? 'وارد' : 'مصروف'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-[var(--text-secondary)]">المبلغ:</span>
              <span className={cn(
                'text-3xl font-bold',
                isIncome ? 'text-green-600' : 'text-red-600'
              )}>
                {isIncome ? '+' : '-'}
                {Number(transaction.amount).toFixed(2)} د.ع
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">الفئة:</p>
                <p className="font-semibold">
                  {CATEGORY_LABELS[transaction.category || ''] || transaction.category || '-'}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">طريقة الدفع:</p>
                <p className="font-semibold">
                  {PAYMENT_METHOD_LABELS[transaction.paymentMethod || ''] || transaction.paymentMethod || '-'}
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">التاريخ:</p>
                <p className="font-semibold">
                  {format(new Date(transaction.date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>

              {/* Branch */}
              {transaction.branch && (
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">الفرع:</p>
                  <p className="font-semibold">{transaction.branch.branchName}</p>
                </div>
              )}

              {/* Created By */}
              {transaction.createdBy && (
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">أنشئت بواسطة:</p>
                  <p className="font-semibold">{transaction.createdBy.fullName}</p>
                </div>
              )}

              {/* Created At */}
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">تاريخ الإنشاء:</p>
                <p className="font-semibold">
                  {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </p>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-[var(--text-secondary)] mb-2">الملاحظات:</p>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount Information (Income only) */}
        {isIncome && transaction.discountValue && transaction.discountValue > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="solar:tag-price-bold-duotone" className="w-5 h-5 text-amber-600" />
                معلومات الخصم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">نوع الخصم:</span>
                <span className="font-semibold text-amber-900">
                  {transaction.discountType === 'PERCENTAGE' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">قيمة الخصم:</span>
                <span className="font-semibold text-amber-900">
                  {transaction.discountType === 'PERCENTAGE'
                    ? `${transaction.discountValue}%`
                    : `${transaction.discountValue.toFixed(2)} د.ع`}
                </span>
              </div>
              {transaction.discountReason && (
                <div className="pt-3 border-t border-amber-200">
                  <span className="text-sm text-amber-700">السبب:</span>
                  <p className="text-amber-900 mt-1">{transaction.discountReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Multi-Item Details */}
        {hasMultipleItems && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon icon="solar:layers-minimalistic-bold-duotone" className="w-5 h-5" />
                  الأصناف ({transaction.transactionInventoryItems?.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedItems(!expandedItems)}
                >
                  <Icon
                    icon={expandedItems ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                    className="w-4 h-4"
                  />
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedItems && (
              <CardContent>
                <div className="space-y-3">
                  {transaction.transactionInventoryItems?.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">
                          {item.inventoryItem?.itemName || 'صنف محذوف'}
                        </h4>
                        <Badge variant="outline">
                          {item.operationType === 'PURCHASE' ? 'شراء' : 'استهلاك'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[var(--text-secondary)]">الكمية:</span>
                          <span className="font-medium mr-2">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">سعر الوحدة:</span>
                          <span className="font-medium mr-2">{item.unitPrice.toFixed(2)} د.ع</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[var(--text-secondary)]">الإجمالي:</span>
                          <span className="font-semibold mr-2 text-primary-600">
                            {(item.quantity * item.unitPrice).toFixed(2)} د.ع
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Linked Debt Information */}
        {hasDebt && transaction.linkedDebt && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="solar:bill-list-bold-duotone" className="w-5 h-5 text-blue-600" />
                الدين المرتبط
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">اسم الدائن:</span>
                <span className="font-semibold text-blue-900">
                  {transaction.linkedDebt.creditorName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">المبلغ الأصلي:</span>
                <span className="font-semibold text-blue-900">
                  {transaction.linkedDebt.originalAmount.toFixed(2)} د.ع
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">المتبقي:</span>
                <span className="font-semibold text-blue-900">
                  {transaction.linkedDebt.remainingAmount.toFixed(2)} د.ع
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">الحالة:</span>
                <Badge variant={transaction.linkedDebt.status === 'PAID' ? 'success' : 'warning'}>
                  {transaction.linkedDebt.status === 'PAID' ? 'مدفوع' : transaction.linkedDebt.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        itemName="المعاملة"
        itemDescription={`${isIncome ? 'وارد' : 'مصروف'} - ${Number(transaction.amount).toFixed(2)} د.ع`}
        isDeleting={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
