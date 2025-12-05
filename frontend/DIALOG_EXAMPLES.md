# Dialog Components - Practical Examples

## أمثلة عملية لاستخدام مكونات Dialogs الموحدة

---

## Example 1: Simple Form Dialog (Add/Edit)

### Component: ProductForm

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/shared/FormDialog';
import { useCreateProduct, useUpdateProduct } from '@/hooks/api/useProducts';
import { Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  price: z.number().min(0, 'السعر يجب أن يكون موجب'),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: { id: string; name: string; price: number; description?: string } | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { mutateAsync: createAsync } = useCreateProduct();
  const { mutateAsync: updateAsync } = useUpdateProduct();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      price: product?.price || 0,
      description: product?.description || '',
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEdit && product) {
        await updateAsync({ id: product.id, data: values });
      } else {
        await createAsync(values);
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}
      description={isEdit ? 'قم بتحديث بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
      maxWidth="sm:max-w-md"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">الاسم *</label>
          <input
            {...form.register('name')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="اسم المنتج"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">السعر *</label>
          <input
            {...form.register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الوصف</label>
          <textarea
            {...form.register('description')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="وصف اختياري"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
}
```

### Usage in Page

```tsx
import { useState } from 'react';
import { ProductFormDialog } from './ProductFormDialog';
import { Button } from '@/components/ui/button';

export function ProductsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsOpen(true);
  };

  return (
    <>
      <Button onClick={handleAdd}>إضافة منتج</Button>
      {/* Product list */}
      <ProductFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        product={selectedProduct}
      />
    </>
  );
}
```

---

## Example 2: Confirmation Dialog

### Delete Confirmation

```tsx
import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDeleteProduct } from '@/hooks/api/useProducts';
import { Button } from '@/components/ui/button';

export function ProductTable({ products }) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string | null;
  }>({ isOpen: false, productId: null });

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleDelete = () => {
    if (!deleteConfirm.productId) return;

    deleteProduct(deleteConfirm.productId, {
      onSuccess: () => {
        setDeleteConfirm({ isOpen: false, productId: null });
      },
    });
  };

  return (
    <>
      <table>
        {/* ... */}
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: true,
                      productId: product.id,
                    })
                  }
                >
                  حذف
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ isOpen: false, productId: null })
        }
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
        actionLabel="حذف"
        cancelLabel="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
```

---

## Example 3: Multiple Dialogs with useDialog Hook

### Page with Add/Edit/Delete Dialogs

```tsx
import { useState } from 'react';
import { useDialog, useDialogs } from '@/hooks/useDialog';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

export function EmployeesPage() {
  // Using useDialogs for multiple dialogs
  const dialogs = useDialogs(['add', 'edit', 'delete']);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);

  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    dialogs.open('edit');
  };

  const handleDelete = (employeeId) => {
    setDeleteEmployeeId(employeeId);
    dialogs.open('delete');
  };

  const confirmDelete = () => {
    if (deleteEmployeeId) {
      deleteEmployee(deleteEmployeeId, {
        onSuccess: () => {
          dialogs.close('delete');
          setDeleteEmployeeId(null);
        },
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Button onClick={() => dialogs.open('add')}>إضافة موظف</Button>
        {/* Employee table with Edit/Delete buttons */}
      </div>

      {/* Add Dialog */}
      <FormDialog
        open={dialogs.isOpen('add')}
        onOpenChange={(open) => !open && dialogs.close('add')}
        title="إضافة موظف جديد"
        maxWidth="sm:max-w-lg"
      >
        <EmployeeForm onSuccess={() => dialogs.close('add')} />
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={dialogs.isOpen('edit')}
        onOpenChange={(open) => !open && dialogs.close('edit')}
        title="تعديل الموظف"
        maxWidth="sm:max-w-lg"
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSuccess={() => dialogs.close('edit')}
        />
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={dialogs.isOpen('delete')}
        onOpenChange={(open) => !open && dialogs.close('delete')}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا الموظف؟"
        actionLabel="حذف"
        cancelLabel="إلغاء"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
```

---

## Example 4: Complex Form with Validation

### Invoice Dialog with Items

```tsx
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FormDialog } from '@/components/shared/FormDialog';
import { Button } from '@/components/ui/button';
import { useCreateInvoice } from '@/hooks/api/useInvoices';

interface InvoiceItem {
  productId: string;
  quantity: number;
  price: number;
}

interface InvoiceFormValues {
  customerName: string;
  items: InvoiceItem[];
  notes?: string;
}

export function InvoiceDialog({ open, onOpenChange }) {
  const { mutateAsync: createAsync, isPending } = useCreateInvoice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      customerName: '',
      items: [{ productId: '', quantity: 1, price: 0 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleSubmit = async (values: InvoiceFormValues) => {
    if (isSubmitting || isPending) return;
    setIsSubmitting(true);

    try {
      await createAsync(values);
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="إنشاء فاتورة جديدة"
      maxWidth="sm:max-w-xl"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Customer Name Field */}
        <div>
          <label>اسم العميل *</label>
          <input
            {...form.register('customerName', { required: true })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <label className="block font-medium">الأصناف</label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                {...form.register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="1"
                className="flex-1 px-2 py-1 border rounded"
                placeholder="الكمية"
              />
              <input
                {...form.register(`items.${index}.price`, {
                  valueAsNumber: true,
                })}
                type="number"
                step="0.01"
                className="flex-1 px-2 py-1 border rounded"
                placeholder="السعر"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
              >
                حذف
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ productId: '', quantity: 1, price: 0 })
            }
          >
            إضافة صنف
          </Button>
        </div>

        {/* Notes Field */}
        <div>
          <label>ملاحظات</label>
          <textarea
            {...form.register('notes')}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            إنشاء الفاتورة
          </Button>
        </div>
      </form>
    </FormDialog>
  );
}
```

---

## Example 5: Dialog with Custom Content (Not Form)

### Settings Dialog

```tsx
import { FormDialog } from '@/components/shared/FormDialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function SettingsDialog({ open, onOpenChange }) {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'ar',
    notifications: true,
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="الإعدادات"
      maxWidth="sm:max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block font-medium">المظهر</label>
          <select
            value={settings.theme}
            onChange={(e) =>
              setSettings({ ...settings, theme: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="light">فاتح</option>
            <option value="dark">داكن</option>
            <option value="auto">تلقائي</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: e.target.checked,
                })
              }
            />
            <span>تفعيل الإشعارات</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            حفظ
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}
```

---

## Best Practices Summary

### ✅ DO
- ✅ Use `FormDialog` for all form dialogs
- ✅ Use `ConfirmDialog` for confirmations
- ✅ Use `mutateAsync` + `async/await` pattern
- ✅ Keep forms clean and focused
- ✅ Add proper error handling
- ✅ Reset forms after success
- ✅ Disable buttons while loading
- ✅ Test in both light and dark modes

### ❌ DON'T
- ❌ Mix Dialog imports with FormDialog
- ❌ Use callbacks in `mutate()` - use `mutateAsync` instead
- ❌ Leave forms unvalidated
- ❌ Forget to close dialog on success
- ❌ Create dialogs with hardcoded widths
- ❌ Skip error handling
- ❌ Use multiple forms in one dialog

---

## Testing Example

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductFormDialog } from './ProductFormDialog';

describe('ProductFormDialog', () => {
  it('should submit form successfully', async () => {
    const handleOpenChange = jest.fn();

    render(
      <ProductFormDialog
        open={true}
        onOpenChange={handleOpenChange}
        product={null}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('اسم المنتج'), {
      target: { value: 'Test Product' },
    });

    fireEvent.click(screen.getByRole('button', { name: /إضافة/i }));

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should close on cancel', () => {
    const handleOpenChange = jest.fn();

    render(
      <ProductFormDialog
        open={true}
        onOpenChange={handleOpenChange}
        product={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /إلغاء/i }));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
```

---

## Questions?

Refer to [DIALOG_COMPONENTS.md](./DIALOG_COMPONENTS.md) for complete API documentation.
