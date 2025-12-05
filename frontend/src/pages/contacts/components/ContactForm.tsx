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
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { ContactTypeSelect } from '@/components/shared/ContactTypeSelect';
import { BranchSelect } from '@/components/shared/BranchSelect';
import { useCreateContact, useUpdateContact } from '@/hooks/api/useContacts';
import { ContactType } from '@/types/enum';
import type { Contact } from '@/types/contacts.types';

interface FormValues {
  name: string;
  type: ContactType;
  branchId: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactToEdit?: Contact;
}

export function ContactForm({ open, onOpenChange, contactToEdit }: ContactFormProps) {
  const isEditing = !!contactToEdit;
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      type: ContactType.SUPPLIER,
      branchId: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: undefined,
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (open) {
      if (contactToEdit) {
        form.reset({
          name: contactToEdit.name,
          type: contactToEdit.type,
          branchId: contactToEdit.branchId || '',
          phone: contactToEdit.phone || '',
          email: contactToEdit.email || '',
          address: contactToEdit.address || '',
          creditLimit: contactToEdit.creditLimit || undefined,
          notes: contactToEdit.notes || '',
        });
      } else {
        form.reset({
          name: '',
          type: ContactType.SUPPLIER,
          branchId: '',
          phone: '',
          email: '',
          address: '',
          creditLimit: undefined,
          notes: '',
        });
      }
    }
  }, [open, contactToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Clean up empty strings
      const cleanedValues = {
        ...values,
        branchId: values.branchId,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        creditLimit: values.creditLimit || undefined,
      };

      if (isEditing && contactToEdit) {
        await updateMutation.mutateAsync({
          id: contactToEdit.id,
          data: cleanedValues,
        });
      } else {
        await createMutation.mutateAsync(cleanedValues);
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
          <DialogTitle>{isEditing ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال جديدة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'الاسم مطلوب' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="اسم جهة الاتصال" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                rules={{ required: 'نوع جهة الاتصال مطلوب' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <ContactTypeSelect
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch */}
              <FormField
                control={form.control}
                name="branchId"
                rules={{ required: 'الفرع مطلوب' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفرع <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <BranchSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        asFormControl={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 07701234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                rules={{
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'البريد الإلكتروني غير صالح',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@domain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Limit */}
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حد الائتمان</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="العنوان الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

