/**
 * Edit Transaction Page
 * Allows editing an existing transaction
 * Category and payment method are read-only
 * Inventory items are editable
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, AlertCircle, Save, Package, User, Wallet, Trash2 } from 'lucide-react';
import { toInputDate, formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import transactionService from '@/api/services/transactionService';
import {
  getCategoryLabel,
  getTransactionTypeLabel,
  getDiscountTypeLabel,
  getOperationTypeLabel,
} from '@/constants/transaction-categories';
import { getPaymentMethodLabel } from '@/components/shared/PaymentMethodSelect';
import { TransactionType, DiscountType } from '@/types/enum';
import type { UpdateTransactionInput } from '@/types';
import { cn } from '@/lib/utils';

// Inventory item schema
const inventoryItemSchema = z.object({
  id: z.string(),
  inventoryItemId: z.string(),
  inventoryItemName: z.string(),
  quantity: z.number().min(0.01, 'الكمية مطلوبة'),
  unitPrice: z.number().min(0, 'السعر غير صحيح'),
  notes: z.string().optional(),
});

// Form validation schema
const editTransactionSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  notes: z.string().optional(),
  discountType: z.nativeEnum(DiscountType).optional().nullable(),
  discountValue: z.number().min(0).optional(),
  discountReason: z.string().optional(),
  inventoryItems: z.array(inventoryItemSchema).optional(),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch transaction
  const {
    data: transaction,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getOne(id!),
    enabled: !!id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTransactionInput) =>
      transactionService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      navigate(`/transactions/${id}`);
    },
  });

  // Form
  const form = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      date: '',
      amount: 0,
      notes: '',
      discountType: null,
      discountValue: 0,
      discountReason: '',
      inventoryItems: [],
    },
  });

  // Field array for inventory items
  const { fields, update } = useFieldArray({
    control: form.control,
    name: 'inventoryItems',
  });

  // Set form values when transaction loads
  useEffect(() => {
    if (transaction) {
      form.reset({
        date: toInputDate(transaction.date),
        amount: transaction.amount,
        notes: transaction.notes || '',
        discountType: transaction.discountType as DiscountType | null,
        discountValue: transaction.discountValue || 0,
        discountReason: transaction.discountReason || '',
        inventoryItems: transaction.transactionInventoryItems?.map((item) => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          inventoryItemName: item.inventoryItem?.name || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || '',
        })) || [],
      });
    }
  }, [transaction, form]);

  // Calculate total from inventory items
  const calculateTotal = () => {
    const items = form.watch('inventoryItems') || [];
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const onSubmit = (data: EditTransactionFormData) => {
    // Calculate amount from inventory items if present
    const hasItems = data.inventoryItems && data.inventoryItems.length > 0;
    const calculatedAmount = hasItems ? calculateTotal() : data.amount;

    const updateData: UpdateTransactionInput = {
      date: data.date,
      amount: calculatedAmount,
      notes: data.notes || undefined,
      discountType: data.discountType || undefined,
      discountValue: data.discountValue || undefined,
      discountReason: data.discountReason || undefined,
      // Include inventory item updates if present
      transactionInventoryItems: hasItems ? data.inventoryItems?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes || undefined,
      })) : undefined,
    };
    updateMutation.mutate(updateData);
  };

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
  const hasInventoryItems = transaction.transactionInventoryItems && transaction.transactionInventoryItems.length > 0;
  const hasEmployee = !!transaction.employee;
  const hasContact = !!transaction.contact;
  const hasLinkedPayable = !!transaction.linkedPayable;
  const hasLinkedReceivable = !!transaction.linkedReceivable;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تعديل المعاملة</h1>
          <p className="text-muted-foreground text-sm">
            {getTransactionTypeLabel(transaction.type)} - {getCategoryLabel(transaction.category)}
          </p>
        </div>
      </div>

      {/* Category & Payment Method Info Card (Read-only) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">معلومات ثابتة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category - Read Only */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">الفئة</p>
              <div className="flex items-center gap-2">
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
                <span className="font-medium">{getCategoryLabel(transaction.category)}</span>
              </div>
            </div>

            {/* Payment Method - Read Only */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">طريقة الدفع</p>
              <p className="font-medium">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            الفئة وطريقة الدفع غير قابلة للتعديل
          </p>
        </CardContent>
      </Card>

      {/* Related Employee Info */}
      {hasEmployee && transaction.employee && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              معلومات الموظف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">الاسم</dt>
                <dd className="font-medium">{transaction.employee.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">المنصب</dt>
                <dd className="font-medium">{transaction.employee.position}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Related Contact/Debt Info */}
      {hasContact && transaction.contact && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-600" />
              جهة الاتصال المرتبطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">الاسم</dt>
                <dd className="font-medium">{transaction.contact.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">النوع</dt>
                <dd className="font-medium">{transaction.contact.type}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Linked Payable/Receivable */}
      {(hasLinkedPayable || hasLinkedReceivable) && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" />
              {hasLinkedPayable ? 'حساب دائن مرتبط' : 'حساب مدين مرتبط'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              هذه المعاملة مرتبطة بـ {hasLinkedPayable ? 'حساب دائن' : 'حساب مدين'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Editable Form Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Editable Inventory Items */}
          {hasInventoryItems && fields.length > 0 && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  الأصناف المرتبطة (قابلة للتعديل)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3">الصنف</th>
                        <th className="text-right py-2 px-3">نوع العملية</th>
                        <th className="text-right py-2 px-3 w-28">الكمية</th>
                        <th className="text-right py-2 px-3 w-32">سعر الوحدة</th>
                        <th className="text-right py-2 px-3 w-32">الإجمالي قبل الخصم</th>
                        <th className="text-right py-2 px-3">نوع الخصم</th>
                        <th className="text-right py-2 px-3">قيمة الخصم</th>
                        <th className="text-right py-2 px-3 w-32">الإجمالي بعد الخصم</th>
                        <th className="text-right py-2 px-3">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const quantity = form.watch(`inventoryItems.${index}.quantity`) || 0;
                        const unitPrice = form.watch(`inventoryItems.${index}.unitPrice`) || 0;
                        const calculatedSubtotal = quantity * unitPrice;
                        
                        // Get original item data for discount info (read-only)
                        const originalItem = transaction.transactionInventoryItems?.find(
                          (item) => item.id === field.id
                        );
                        const hasDiscount = originalItem?.discountType && originalItem?.discountValue;
                        const displaySubtotal = originalItem?.subtotal ?? calculatedSubtotal;
                        const displayTotal = originalItem?.total ?? calculatedSubtotal;

                        return (
                          <tr key={field.id} className="border-b">
                            <td className="py-2 px-3">
                              <div className="font-medium">
                                {field.inventoryItemName || '-'}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs">
                                {getOperationTypeLabel(originalItem?.operationType)}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              <FormField
                                control={form.control}
                                name={`inventoryItems.${index}.quantity`}
                                render={({ field: inputField }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="h-8 w-24"
                                        {...inputField}
                                        onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <FormField
                                control={form.control}
                                name={`inventoryItems.${index}.unitPrice`}
                                render={({ field: inputField }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="h-8 w-28"
                                        {...inputField}
                                        onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-medium text-muted-foreground">
                                {formatCurrency(displaySubtotal)}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {hasDiscount ? (
                                <Badge variant="secondary" className="text-xs">
                                  {getDiscountTypeLabel(originalItem?.discountType)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {hasDiscount ? (
                                <span className="text-orange-600 font-medium text-xs">
                                  {originalItem?.discountType === DiscountType.PERCENTAGE
                                    ? `${originalItem?.discountValue}%`
                                    : formatCurrency(originalItem?.discountValue || 0)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-green-600">
                                {formatCurrency(displayTotal)}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <FormField
                                control={form.control}
                                name={`inventoryItems.${index}.notes`}
                                render={({ field: inputField }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        placeholder="ملاحظة..."
                                        className="h-8 text-xs"
                                        {...inputField}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2">
                        <td colSpan={7} className="py-2 px-3 font-bold text-left">
                          المجموع الكلي:
                        </td>
                        <td className="py-2 px-3 font-bold text-green-600">
                          {formatCurrency(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Editable Fields */}
          <Card>
            <CardHeader>
              <CardTitle>تعديل البيانات الأخرى</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التاريخ</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount - only if no inventory items */}
                {!hasInventoryItems && (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المبلغ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Discount Section (for income only, no inventory items) */}
              {isIncome && !hasInventoryItems && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">معلومات الخصم (اختياري)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Discount Type */}
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الخصم</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value === 'none' ? null : value)
                            }
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="بدون خصم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">بدون خصم</SelectItem>
                              <SelectItem value={DiscountType.PERCENTAGE}>
                                نسبة مئوية
                              </SelectItem>
                              <SelectItem value={DiscountType.AMOUNT}>
                                مبلغ ثابت
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Discount Value */}
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>قيمة الخصم</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Discount Reason */}
                    <FormField
                      control={form.control}
                      name="discountReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سبب الخصم</FormLabel>
                          <FormControl>
                            <Input placeholder="سبب الخصم" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أي ملاحظات إضافية..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  حفظ التغييرات
                </Button>
              </div>

              {/* Error Message */}
              {updateMutation.isError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
