import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm:max-w-sm' | 'sm:max-w-md' | 'sm:max-w-lg' | 'sm:max-w-xl' | 'sm:max-w-2xl';
}

/**
 * Unified Form Dialog Component
 *
 * استخدام موحد لكل dialogs النماذج في التطبيق
 *
 * Features:
 * - Props-based control (open/onOpenChange)
 * - Configurable width
 * - Optional description
 * - RTL support
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="إضافة موظف"
 *   description="أدخل بيانات الموظف الجديد"
 * >
 *   <YourForm />
 * </FormDialog>
 * ```
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'sm:max-w-md',
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
