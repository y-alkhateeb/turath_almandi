import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@/components/ui';
import { useCreateUser, useUpdateUser } from '@/hooks/api/useUsers';
import { BranchSelect } from '@/components/shared/BranchSelect';
import { UserRole } from '#/enum';
import type { UserWithBranch } from '#/entity';

interface FormValues {
  username: string;
  password: string;
  role: UserRole;
  branchId: string | null;
  changePassword: boolean;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserWithBranch;
}

export function UserForm({ open, onOpenChange, userToEdit }: UserFormProps) {
  const isEditing = !!userToEdit;
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      username: '',
      password: '',
      role: UserRole.ACCOUNTANT,
      branchId: null,
      changePassword: false,
    },
  });

  const selectedRole = form.watch('role');

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (open) {
      if (userToEdit) {
        form.reset({
          username: userToEdit.username,
          password: '',
          role: userToEdit.role,
          branchId: userToEdit.branchId || null,
          changePassword: false,
        });
      } else {
        form.reset({
          username: '',
          password: '',
          role: UserRole.ACCOUNTANT,
          branchId: null,
          changePassword: false,
        });
      }
    }
  }, [open, userToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && userToEdit) {
        const updateData: any = {
          role: values.role,
          branchId: values.role === UserRole.ADMIN ? null : values.branchId,
        };

        // Only include password if user wants to change it
        if (values.changePassword && values.password) {
          updateData.password = values.password;
        }

        await updateMutation.mutateAsync({
          id: userToEdit.id,
          data: updateData,
        });
      } else {
        await createMutation.mutateAsync({
          username: values.username,
          password: values.password,
          role: values.role,
          branchId: values.role === UserRole.ADMIN ? null : values.branchId,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Password validation regex: min 8 chars, uppercase, lowercase, digit, special char
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'قم بتعديل معلومات المستخدم' : 'أدخل معلومات المستخدم الجديد'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                rules={{
                  required: 'اسم المستخدم مطلوب',
                  minLength: { value: 3, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' },
                  maxLength: { value: 50, message: 'اسم المستخدم يجب ألا يتجاوز 50 حرف' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      اسم المستخدم <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="اسم المستخدم" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                rules={{ required: 'الدور مطلوب' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      الدور <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.ADMIN}>مدير</SelectItem>
                          <SelectItem value={UserRole.ACCOUNTANT}>محاسب</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password */}
            {(!isEditing || form.watch('changePassword')) && (
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: isEditing ? (form.watch('changePassword') ? 'كلمة المرور مطلوبة' : false) : 'كلمة المرور مطلوبة',
                  minLength: { value: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
                  maxLength: { value: 100, message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' },
                  pattern: {
                    value: passwordPattern,
                    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      كلمة المرور <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="أدخل كلمة المرور"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Change Password Checkbox (Edit mode only) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="changePassword"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>تغيير كلمة المرور</FormLabel>
                      <p className="text-sm text-muted-foreground">اتركه غير محدد إذا لم ترد تغيير كلمة المرور</p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Branch - Required for ACCOUNTANT, disabled for ADMIN */}
            <FormField
              control={form.control}
              name="branchId"
              rules={{
                required: selectedRole === UserRole.ACCOUNTANT ? 'الفرع مطلوب للمحاسب' : false,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    الفرع {selectedRole === UserRole.ACCOUNTANT && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <BranchSelect
                    value={field.value ?? undefined}
                    onValueChange={(value) => field.onChange(value ?? null)}
                    placeholder={selectedRole === UserRole.ADMIN ? 'غير متاح للمدير' : 'اختر الفرع'}
                    disabled={selectedRole === UserRole.ADMIN}
                    asFormControl
                  />
                  <FormMessage />
                  {selectedRole === UserRole.ADMIN && (
                    <p className="text-sm text-muted-foreground">المديرون لا يحتاجون إلى فرع محدد</p>
                  )}
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

