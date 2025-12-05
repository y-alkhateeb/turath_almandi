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
  Textarea,
} from '@/components/ui';
import { FormDialog } from '@/components/shared/FormDialog';
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect';
import { usePayPayable } from '@/hooks/api/usePayables';
import { PaymentMethod } from '@/types/enum';
import type { AccountPayable } from '@/types/payables.types';

interface FormValues {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

interface PayablePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: AccountPayable | null;
}

export function PayablePaymentDialog({ open, onOpenChange, payable }: PayablePaymentDialogProps) {
  const payMutation = usePayPayable();

  const form = useForm<FormValues>({
    defaultValues: {
      amountPaid: 0,
      paymentDate: toInputDate(new Date()),
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open && payable) {
      form.reset({
        amountPaid: payable.remainingAmount,
        paymentDate: toInputDate(new Date()),
        paymentMethod: PaymentMethod.CASH,
        referenceNumber: '',
        notes: '',
      });
    }
  }, [open, payable, form]);

  const onSubmit = async (values: FormValues) => {
    if (!payable) return;

    try {
      await payMutation.mutateAsync({
        id: payable.id,
        data: values,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  if (!payable) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تسجيل دفعة للمورد"
      description={`تسجيل دفعة للدين الخاص بالمورد: ${payable.contact?.name} | المبلغ المتبقي: ${payable.remainingAmount}`}
      maxWidth="sm:max-w-lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amountPaid"
            rules={{
              required: 'المبلغ مطلوب',
              min: { value: 0.01, message: 'المبلغ يجب أن يكون أكبر من صفر' }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>المبلغ المدفوع <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    max={payable.remainingAmount}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentDate"
              rules={{ required: 'يرجى اختيار التاريخ' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الدفع <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              rules={{ required: 'يرجى اختيار طريقة الدفع' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>طريقة الدفع <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <PaymentMethodSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم المرجع</FormLabel>
                <FormControl>
                  <Input placeholder="رقم الحوالة / الشيك (اختياري)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            <Button type="submit" disabled={payMutation.isPending}>
              {payMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              تسجيل الدفعة
            </Button>
          </div>
        </form>
      </Form>
    </FormDialog>
  );
}
