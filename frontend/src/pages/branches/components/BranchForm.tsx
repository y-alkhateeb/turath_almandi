import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  Checkbox,
} from '@/components/ui';
import { FormDialog } from '@/components/shared/FormDialog';
import { useCreateBranch, useUpdateBranch } from '@/hooks/api/useBranches';
import type { Branch } from '#/entity';

interface FormValues {
  name: string;
  location: string;
  managerName: string;
  isDeleted: boolean;
}

interface BranchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchToEdit?: Branch;
}

export function BranchForm({ open, onOpenChange, branchToEdit }: BranchFormProps) {
  const isEditing = !!branchToEdit;
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      location: '',
      managerName: '',
      isDeleted: false,
    },
  });

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (open) {
      if (branchToEdit) {
        form.reset({
          name: branchToEdit.name,
          location: branchToEdit.location,
          managerName: branchToEdit.managerName,
          isDeleted: branchToEdit.isDeleted,
        });
      } else {
        form.reset({
          name: '',
          location: '',
          managerName: '',
          isDeleted: false,
        });
      }
    }
  }, [open, branchToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && branchToEdit) {
        await updateMutation.mutateAsync({
          id: branchToEdit.id,
          data: values,
        });
      } else {
        // For create, only send name, location, and managerName (isDeleted is not in CreateBranchInput)
        const { isDeleted, ...createData } = values;
        await createMutation.mutateAsync(createData);
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
      title={isEditing ? 'تعديل فرع' : 'إضافة فرع جديد'}
      maxWidth="sm:max-w-lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                rules={{
                  required: 'اسم الفرع مطلوب',
                  maxLength: { value: 200, message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      اسم الفرع <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="اسم الفرع" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manager Name */}
              <FormField
                control={form.control}
                name="managerName"
                rules={{
                  required: 'اسم المدير مطلوب',
                  maxLength: { value: 200, message: 'اسم المدير يجب ألا يتجاوز 200 حرف' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      اسم المدير <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="اسم مدير الفرع" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              rules={{
                required: 'الموقع مطلوب',
                maxLength: { value: 500, message: 'الموقع يجب ألا يتجاوز 500 حرف' },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    الموقع <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="موقع الفرع الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Deleted - Only show in edit mode (inverted to show as "Is Active") */}
            {isEditing && (
              <FormField
                control={form.control}
                name="isDeleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={!field.value} onCheckedChange={(checked) => field.onChange(!checked)} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>الفرع نشط</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        الفروع غير النشطة (المحذوفة) لن تظهر في القوائم الافتراضية
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

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

