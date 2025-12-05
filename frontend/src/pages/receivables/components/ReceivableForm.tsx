import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toInputDate } from '@/utils/format';
import { Loader2 } from 'lucide-react';

import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { FormDialog } from '@/components/shared/FormDialog';
import { useCustomers } from '@/hooks/api/useContacts';
import { useCreateReceivable, useUpdateReceivable } from '@/hooks/api/useReceivables';
import type { AccountReceivable } from '@/types/receivables.types';

interface FormValues {
  contactId: string;
  amount: number;
  date: string;
  dueDate?: string;
  invoiceNumber?: string;
  description?: string;
  notes?: string;
}

interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivableToEdit?: AccountReceivable;
}

export function ReceivableForm({ open, onOpenChange, receivableToEdit }: ReceivableFormProps) {
  const isEditing = !!receivableToEdit;
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
  const createMutation = useCreateReceivable();
  const updateMutation = useUpdateReceivable();

  const form = useForm<FormValues>({
    defaultValues: {
      contactId: '',
      amount: 0,
      date: toInputDate(new Date()),
      dueDate: '',
      invoiceNumber: '',
      description: '',
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (open) {
      if (receivableToEdit) {
        form.reset({
          contactId: receivableToEdit.contactId,
          amount: receivableToEdit.originalAmount,
          date: toInputDate(receivableToEdit.date),
          dueDate: receivableToEdit.dueDate ? toInputDate(receivableToEdit.dueDate) : '',
          invoiceNumber: receivableToEdit.invoiceNumber || '',
          description: receivableToEdit.description || '',
          notes: receivableToEdit.notes || '',
        });
      } else {
        form.reset({
          contactId: '',
          amount: 0,
          date: toInputDate(new Date()),
          dueDate: '',
          invoiceNumber: '',
          description: '',
          notes: '',
        });
      }
    }
  }, [open, receivableToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && receivableToEdit) {
        await updateMutation.mutateAsync({
          id: receivableToEdit.id,
          data: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'تعديل ذمة مدينة' : 'إضافة ذمة مدينة جديدة'}
      maxWidth="sm:max-w-lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact */}
              <FormField
                control={form.control}
                name="contactId"
                rules={{ required: 'يرجى اختيار العميل' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العميل <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <div className="p-2 flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          customersData?.data.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                rules={{ 
                  required: 'المبلغ مطلوب',
                  min: { value: 0.01, message: 'المبلغ يجب أن يكون أكبر من صفر' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                rules={{ required: 'يرجى اختيار التاريخ' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاستحقاق <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ السداد المتوقع</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Number */}
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الفاتورة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: INV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Input placeholder="وصف مختصر للدين" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </Form>
    </FormDialog>
  );
}
