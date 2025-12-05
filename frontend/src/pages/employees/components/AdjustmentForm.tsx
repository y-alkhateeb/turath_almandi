import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeAdjustmentType } from '@/types/enum';
import { useCreateAdjustment } from '@/hooks/api/usePayroll';
import { Loader2 } from 'lucide-react';

const adjustmentSchema = z.object({
  type: z.nativeEnum(EmployeeAdjustmentType),
  amount: z.number().min(1, 'المبلغ يجب أن يكون أكبر من 0'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  description: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface AdjustmentFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

export function AdjustmentForm({ employeeId, onSuccess }: AdjustmentFormProps) {
  const { mutateAsync: createAdjustmentAsync, isPending } = useCreateAdjustment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: EmployeeAdjustmentType.BONUS,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const handleSubmit = async (values: AdjustmentFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Convert date to ISO string for backend
      const data = {
        employeeId,
        type: values.type,
        amount: values.amount,
        date: new Date(values.date).toISOString(),
        description: values.description,
      };

      await createAdjustmentAsync(data);
      form.reset();
      onSuccess?.();
    } catch {
      // Error is already handled by the mutation hook (toast.error)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع التسوية</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={EmployeeAdjustmentType.BONUS}>مكافأة</SelectItem>
                  <SelectItem value={EmployeeAdjustmentType.DEDUCTION}>خصم</SelectItem>
                  <SelectItem value={EmployeeAdjustmentType.ADVANCE}>سلفة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات (اختياري)</FormLabel>
              <FormControl>
                <Textarea placeholder="سبب المكافأة/الخصم..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            إعادة تعيين
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {(isPending || isSubmitting) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </div>
      </form>
    </Form>
  );
}
