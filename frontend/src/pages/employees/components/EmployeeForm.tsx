import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { EmployeeStatus } from '@/types/enum';
import { Branch } from '@/types/entity';
import { formatDate } from '@/utils/format';

// Schema
const employeeSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(200),
  position: z.string().min(2, 'المنصب يجب أن يكون حرفين على الأقل').max(100),
  branchId: z.string().min(1, 'الفرع مطلوب'),
  baseSalary: z.number().min(1, 'الراتب يجب أن يكون أكبر من 0'),
  allowance: z.number().min(0, 'البدلات يجب أن تكون 0 أو أكثر'),
  hireDate: z.date(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

// Define a type for the initial data that might come from the API (where dates are strings)
type EmployeeInitialData = Omit<Partial<EmployeeFormValues>, 'hireDate'> & {
  hireDate?: string | Date;
};

interface EmployeeFormProps {
  initialData?: EmployeeInitialData;
  branches: Branch[];
  onSubmit: (data: EmployeeFormValues) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
  isAdmin?: boolean;
  userBranchId?: string;
}

export default function EmployeeForm({
  initialData,
  branches,
  onSubmit,
  isSubmitting,
  isEdit = false,
  isAdmin = false,
  userBranchId,
}: EmployeeFormProps) {
  const defaultValues: Partial<EmployeeFormValues> = {
    name: initialData?.name || '',
    position: initialData?.position || '',
    branchId: initialData?.branchId || (isAdmin ? '' : userBranchId || ''),
    baseSalary: initialData?.baseSalary ? Number(initialData.baseSalary) : 0,
    allowance: initialData?.allowance ? Number(initialData.allowance) : 0,
    hireDate: initialData?.hireDate ? new Date(initialData.hireDate) : new Date(),
    status: initialData?.status || EmployeeStatus.ACTIVE,
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });

  const handleSubmit = (values: EmployeeFormValues) => {
    // Ensure dates are correctly formatted if needed by the API, 
    // though usually the API handles ISO strings or Date objects fine.
    // If specific string format is needed:
    // const formattedData = { ...values, hireDate: format(values.hireDate, 'yyyy-MM-dd') };
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الموظف</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم الموظف" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Position */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المنصب الوظيفي</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: مدير فرع، محاسب، طباخ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Branch */}
          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الفرع</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isAdmin}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hire Date */}
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ التعيين</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          formatDate(field.value)
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Base Salary */}
          <FormField
            control={form.control}
            name="baseSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الراتب الأساسي</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Allowance */}
          <FormField
            control={form.control}
            name="allowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البدلات (اختياري)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (Edit Mode Only) */}
          {isEdit && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحالة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={EmployeeStatus.ACTIVE}>نشط</SelectItem>
                      <SelectItem value={EmployeeStatus.RESIGNED}>مستقيل</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'حفظ التغييرات' : 'إضافة الموظف'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
