# Dialog Components Guide

## مرجع استخدام مكونات الـ Dialogs الموحدة في التطبيق

### Overview

تم إنشاء مكونات Dialogs موحدة وقابلة لإعادة الاستخدام لتوحيد تجربة المستخدم عبر التطبيق وتقليل تكرار الكود.

---

## 1. FormDialog Component

### الوصف
مكون Dialog موحد للنماذج (Forms) يدعم الإنشاء والتعديل.

### الموقع
`frontend/src/components/shared/FormDialog.tsx`

### الخصائص (Props)

```typescript
interface FormDialogProps {
  open: boolean;                    // حالة فتح/إغلاق الـ dialog
  onOpenChange: (open: boolean) => void;  // callback عند تغيير الحالة
  title: string;                    // عنوان الـ dialog
  description?: string;             // وصف اختياري
  children: React.ReactNode;        // محتوى الفورم
  maxWidth?: MaxWidth;              // عرض الـ dialog (sm:max-w-sm | sm:max-w-md | sm:max-w-lg | sm:max-w-xl | sm:max-w-2xl)
}
```

### مثال الاستخدام

```tsx
import { FormDialog } from '@/components/shared/FormDialog';
import { AdjustmentForm } from './components/AdjustmentForm';

export function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>إضافة تسوية</Button>

      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="إضافة تسوية جديدة"
        description="أدخل بيانات التسوية"
        maxWidth="sm:max-w-md"
      >
        <AdjustmentForm
          employeeId="123"
          onSuccess={() => setIsOpen(false)}
        />
      </FormDialog>
    </>
  );
}
```

### الميزات
- ✅ دعم RTL (العربية)
- ✅ دعم Dark Mode
- ✅ عرض قابل للتكوين
- ✅ إغلاق تلقائي بالضغط على X أو خارج النافذة
- ✅ Accessibility (ARIA)
- ✅ Animations سلسة

---

## 2. ConfirmDialog Component

### الوصف
مكون Dialog موحد للتأكيد على الإجراءات (حذف، تأكيد، إلخ).

### الموقع
`frontend/src/components/shared/ConfirmDialog.tsx`

### الخصائص (Props)

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel?: string;           // نص زر التأكيد (افتراضي: "تأكيد")
  cancelLabel?: string;           // نص زر الإلغاء (افتراضي: "إلغاء")
  variant?: 'default' | 'destructive';  // نمط الزر
  onConfirm: () => void;
  isLoading?: boolean;
}
```

### مثال الاستخدام

```tsx
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export function MyPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: deleteItem } = useDeleteItem();

  const handleDelete = async () => {
    setIsLoading(true);
    deleteItem(itemId, {
      onSuccess: () => {
        setIsOpen(false);
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      }
    });
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        حذف
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا العنصر؟"
        actionLabel="حذف"
        cancelLabel="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  );
}
```

### الميزات
- ✅ دعم Variant (default/destructive)
- ✅ حالة Loading
- ✅ تعطيل الأزرار أثناء التحميل
- ✅ دعم RTL و Dark Mode
- ✅ Accessibility كاملة

---

## 3. useDialog Hook

### الوصف
Hook مخصص لإدارة حالة الـ dialog (open/close/toggle) مع تخزين البيانات (data storage).

### الموقع
`frontend/src/hooks/useDialog.ts`

### الاستخدام - Dialog واحد

```tsx
import { useDialog } from '@/hooks/useDialog';

export function MyPage() {
  const { isOpen, open, close, data, setData } = useDialog<Item | null>(null);

  return (
    <>
      <Button onClick={() => open(selectedItem)}>تعديل</Button>

      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && close()}
        title="تعديل العنصر"
      >
        <ItemForm
          item={data}
          onSuccess={() => close()}
        />
      </FormDialog>
    </>
  );
}
```

### الاستخدام - عدة Dialogs

```tsx
import { useDialogs } from '@/hooks/useDialog';

export function MyPage() {
  const dialogs = useDialogs(['add', 'edit', 'delete']);

  return (
    <>
      <Button onClick={() => dialogs.open('add')}>إضافة</Button>

      <FormDialog
        open={dialogs.isOpen('add')}
        onOpenChange={(open) => !open && dialogs.close('add')}
        title="إضافة عنصر جديد"
      >
        <AddForm />
      </FormDialog>

      <ConfirmDialog
        open={dialogs.isOpen('delete')}
        onOpenChange={(open) => !open && dialogs.close('delete')}
        title="تأكيد الحذف"
        onConfirm={() => {
          // ...
          dialogs.close('delete');
        }}
      />
    </>
  );
}
```

### الميزات
- ✅ إدارة حالة مركزية
- ✅ تخزين البيانات
- ✅ Reset بعد الإغلاق
- ✅ Multiple Dialogs
- ✅ Memoized Callbacks

---

## 4. Pattern: Form Dialog + mutateAsync

### أفضل الممارسات

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormDialog } from '@/components/shared/FormDialog';
import { useCreateItem } from '@/hooks/api/useItems';

export function ItemForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutateAsync: createAsync, isPending } = useCreateItem();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({ /* ... */ });

  const handleSubmit = async (values: FormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createAsync(values);
      form.reset();
      onSuccess();
    } catch {
      // Error handled by mutation hook (toast.error)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form fields */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            إعادة تعيين
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            حفظ
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### النقاط المهمة
1. استخدام `mutateAsync` بدلاً من `mutate`
2. استخدام `async/await` مع `try/catch`
3. إضافة `isSubmitting` state للتحكم بالزر
4. استدعاء `onSuccess()` callback بعد النجاح
5. توظيف `form.reset()` لمسح الفورم

---

## Files That Should Use FormDialog

### Current Implementation
- [x] `EmployeeDetailPage.tsx` - AdjustmentForm
- [ ] `ReceivablesPage.tsx` - ReceivableForm, ReceivableCollectDialog
- [ ] `PayablesPage.tsx` - PayableForm, PayablePaymentDialog
- [ ] `InventoryPage.tsx` - AddEditItemDialog, RecordConsumptionDialog
- [ ] `ContactsPage.tsx` - ContactForm
- [ ] `BranchesPage.tsx` - BranchForm
- [ ] `UsersPage.tsx` - UserForm

### Next Steps for Refactoring
كل الملفات المذكورة أعلاه يمكن استخدام `FormDialog` مباشرة دون الحاجة لـ Dialog imports منفصلة.

---

## Accessibility Checklist

عند إنشاء Form في Dialog تأكد من:
- ✅ العنوان واضح ومفيد
- ✅ حقول مع Labels مناسبة
- ✅ رسائل الخطأ واضحة
- ✅ زر التأكيد بارز
- ✅ زر الإلغاء متاح
- ✅ Focus management صحيح
- ✅ ARIA attributes موجودة

---

## Dark Mode & RTL Support

جميع المكونات تدعم تلقائياً:
- ✅ Dark Mode (via CSS variables)
- ✅ RTL Layout (via Radix UI)
- ✅ Color Contrast (WCAG compliant)

```tsx
// مثال: استخدام semantic colors
<Button variant="destructive">حذف</Button>
<Badge className="bg-success/10 text-success">مكتمل</Badge>
```

---

## Summary

| Component | الاستخدام | الميزات |
|-----------|----------|--------|
| **FormDialog** | النماذج | قابل للتكوين، مرن |
| **ConfirmDialog** | التأكيد | Variant support، Loading |
| **useDialog** | إدارة الحالة | Multiple dialogs، Data storage |

استخدم هذه المكونات لتحسين تماسك الكود وتقليل التكرار! 🎉
