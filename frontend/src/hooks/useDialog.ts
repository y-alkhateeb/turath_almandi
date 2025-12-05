import { useState, useCallback } from 'react';

/**
 * Custom Hook for Dialog State Management
 *
 * حول بسيط لإدارة حالة الـ dialogs في التطبيق
 *
 * Features:
 * - Simple open/close state
 * - Optional data storage
 * - Memoized callbacks
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, data } = useDialog<InventoryItem | null>(null);
 *
 * return (
 *   <>
 *     <Button onClick={() => open(item)}>Edit</Button>
 *     <FormDialog open={isOpen} onOpenChange={(open) => !open && close()}>
 *       <YourForm data={data} />
 *     </FormDialog>
 *   </>
 * );
 * ```
 */
export function useDialog<T>(initialData?: T) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(initialData);

  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset data after closing animation
    setTimeout(() => setData(initialData), 200);
  }, [initialData]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    setData,
    setIsOpen,
  };
}

/**
 * Custom Hook for Multiple Dialogs Management
 *
 * إدارة حالة عدة dialogs في نفس الصفحة
 *
 * @example
 * ```tsx
 * const dialogs = useDialogs(['add', 'edit', 'delete']);
 *
 * return (
 *   <>
 *     <FormDialog open={dialogs.isOpen('add')} onOpenChange={dialogs.toggle('add')}>
 *       Add Form
 *     </FormDialog>
 *     <FormDialog open={dialogs.isOpen('edit')} onOpenChange={dialogs.toggle('edit')}>
 *       Edit Form
 *     </FormDialog>
 *   </>
 * );
 * ```
 */
export function useDialogs(dialogNames: string[]) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>(
    Object.fromEntries(dialogNames.map((name) => [name, false]))
  );

  const isOpen = useCallback((name: string) => openDialogs[name] ?? false, [openDialogs]);

  const open = useCallback((name: string) => {
    setOpenDialogs((prev) => ({ ...prev, [name]: true }));
  }, []);

  const close = useCallback((name: string) => {
    setOpenDialogs((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggle = useCallback((name: string) => {
    setOpenDialogs((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const closeAll = useCallback(() => {
    setOpenDialogs(Object.fromEntries(dialogNames.map((name) => [name, false])));
  }, [dialogNames]);

  return {
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    openDialogs,
  };
}
