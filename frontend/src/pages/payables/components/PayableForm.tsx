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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { useSuppliers } from '@/hooks/api/useContacts';
import { useCreatePayable, useUpdatePayable } from '@/hooks/api/usePayables';
import type { AccountPayable } from '@/types/payables.types';

interface FormValues {
  contactId: string;
  amount: number;
  date: string;
  dueDate?: string;
  invoiceNumber?: string;
  description?: string;
  notes?: string;
}

interface PayableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payableToEdit?: AccountPayable;
}

export function PayableForm({ open, onOpenChange, payableToEdit }: PayableFormProps) {
  const isEditing = !!payableToEdit;
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers({ limit: 100 });
  const createMutation = useCreatePayable();
  const updateMutation = useUpdatePayable();

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
      if (payableToEdit) {
        form.reset({
          contactId: payableToEdit.contactId,
          amount: payableToEdit.originalAmount,
          date: toInputDate(payableToEdit.date),
          dueDate: payableToEdit.dueDate ? toInputDate(payableToEdit.dueDate) : '',
          invoiceNumber: payableToEdit.invoiceNumber || '',
          description: payableToEdit.description || '',
          notes: payableToEdit.notes || '',
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
  }, [open, payableToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && payableToEdit) {
        await updateMutation.mutateAsync({
          id: payableToEdit.id,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل ذمة دائنة' : 'إضافة ذمة دائنة جديدة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact */}
              <FormField
                control={form.control}
                name="contactId"
                rules={{ required: 'يرجى اختيار المورد' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المورد <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المورد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingSuppliers ? (
                          <div className="p-2 flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          suppliersData?.data.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
