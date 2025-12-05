/**
 * View Transaction Page
 * Displays detailed information about a single transaction
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import transactionService from '@/api/services/transactionService';
import {
  getCategoryLabel,
  getTransactionTypeLabel,
  getDiscountTypeLabel,
  getOperationTypeLabel,
} from '@/constants/transaction-categories';
import { getPaymentMethodLabel } from '@/components/shared/PaymentMethodSelect';
import { TransactionType, DiscountType } from '@/types/enum';
import { cn } from '@/lib/utils';

export default function ViewTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: transaction,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">المعاملة غير موجودة</p>
        <Button onClick={() => navigate('/transactions')}>العودة للقائمة</Button>
      </div>
    );
  }

  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل المعاملة</h1>
            <p className="text-muted-foreground text-sm">
              {getCategoryLabel(transaction.category)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/transactions/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 ml-2" />
            تعديل
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>معلومات المعاملة</CardTitle>
            <Badge
              variant={isIncome ? 'default' : 'destructive'}
              className={cn(
                isIncome
                  ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                  : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
              )}
            >
              {getTransactionTypeLabel(transaction.type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div>
              <dt className="text-sm text-muted-foreground">المبلغ</dt>
              <dd
                className={cn(
                  'text-2xl font-bold',
                  isIncome ? 'text-secondary' : 'text-destructive'
                )}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </dd>
            </div>

            {/* Date */}
            <div>
              <dt className="text-sm text-muted-foreground">التاريخ</dt>
              <dd className="text-lg font-medium">{formatDate(transaction.date)}</dd>
            </div>

            {/* Category */}
            <div>
              <dt className="text-sm text-muted-foreground">الفئة</dt>
              <dd className="text-lg">{getCategoryLabel(transaction.category)}</dd>
            </div>

            {/* Payment Method */}
            <div>
              <dt className="text-sm text-muted-foreground">طريقة الدفع</dt>
              <dd className="text-lg">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </dd>
            </div>

            {/* Branch */}
            {transaction.branch && (
              <div>
                <dt className="text-sm text-muted-foreground">الفرع</dt>
                <dd className="text-lg">{transaction.branch.name}</dd>
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <dt className="text-sm text-muted-foreground">ملاحظات</dt>
              <dd className="text-lg">{transaction.notes || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Discount Info (if applicable) */}
      {transaction.discountType && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات الخصم</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm text-muted-foreground">نوع الخصم</dt>
                <dd className="text-lg">{getDiscountTypeLabel(transaction.discountType)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">قيمة الخصم</dt>
                <dd className="text-lg">
                  {transaction.discountType === DiscountType.PERCENTAGE
                    ? `${transaction.discountValue}%`
                    : formatCurrency(transaction.discountValue || 0)}
                </dd>
              </div>
              {transaction.discountReason && (
                <div>
                  <dt className="text-sm text-muted-foreground">سبب الخصم</dt>
                  <dd className="text-lg">{transaction.discountReason}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Related Entities */}
      {(transaction.contact || transaction.employee) && (
        <Card>
          <CardHeader>
            <CardTitle>الكيانات المرتبطة</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transaction.contact && (
                <div>
                  <dt className="text-sm text-muted-foreground">جهة الاتصال</dt>
                  <dd className="text-lg">{transaction.contact.name}</dd>
                </div>
              )}
              {transaction.employee && (
                <div>
                  <dt className="text-sm text-muted-foreground">الموظف</dt>
                  <dd className="text-lg">
                    {transaction.employee.name} - {transaction.employee.position}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Inventory Items */}
      {transaction.transactionInventoryItems &&
        transaction.transactionInventoryItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>الأصناف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2 px-3">الصنف</th>
                      <th className="text-right py-2 px-3">نوع العملية</th>
                      <th className="text-right py-2 px-3">الكمية</th>
                      <th className="text-right py-2 px-3">سعر الوحدة</th>
                      <th className="text-right py-2 px-3">الإجمالي قبل الخصم</th>
                      <th className="text-right py-2 px-3">نوع الخصم</th>
                      <th className="text-right py-2 px-3">قيمة الخصم</th>
                      <th className="text-right py-2 px-3">الإجمالي بعد الخصم</th>
                      <th className="text-right py-2 px-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.transactionInventoryItems.map((item) => {
                      const hasDiscount = item.discountType && item.discountValue;
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-3">
                            <div className="font-medium">
                              {item.inventoryItem?.name || '-'}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">
                              {getOperationTypeLabel(item.operationType)}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-medium">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {hasDiscount ? (
                              <Badge variant="secondary" className="text-xs">
                                {getDiscountTypeLabel(item.discountType)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {hasDiscount ? (
                              <span className="text-orange-600 font-medium">
                                {item.discountType === DiscountType.PERCENTAGE
                                  ? `${item.discountValue}%`
                                  : formatCurrency(item.discountValue || 0)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-green-600">
                              {formatCurrency(item.total)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-muted-foreground text-xs">
                              {item.notes || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transaction.creator && (
              <div>
                <dt className="text-sm text-muted-foreground">أنشأ بواسطة</dt>
                <dd className="text-lg">{transaction.creator.username}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">تاريخ الإنشاء</dt>
              <dd className="text-lg">{formatDate(transaction.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
