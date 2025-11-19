/**
 * Zod Validation Schemas
 *
 * This file contains centralized Zod schemas matching backend DTOs for API validation.
 *
 * ⚠️ IMPORTANT ARCHITECTURE NOTES:
 *
 * 1. **When to Use These Schemas:**
 *    - API request/response validation
 *    - Type inference for API data
 *    - Shared validation logic across multiple components
 *
 * 2. **When to Use Local Schemas (in components):**
 *    - Forms with frontend-only fields (e.g., branchId in create forms)
 *    - Forms requiring native TypeScript enums (z.nativeEnum vs z.enum)
 *    - Complex conditional validation specific to UI flows
 *    - Forms with different validation rules than backend (e.g., stricter client-side)
 *
 * 3. **Current Form Components:**
 *    All form components (TransactionForm, UserForm, etc.) use LOCAL schemas because:
 *    - They need z.nativeEnum() to work with TypeScript enums from @/types/enum
 *    - They include UI-specific fields not in backend DTOs
 *    - This is intentional and correct - don't try to force them to use these schemas
 *
 * 4. **Keeping Schemas in Sync:**
 *    - Backend changes should be reflected here AND in form local schemas
 *    - Run validation tests to catch discrepancies
 *    - Document any intentional differences
 *
 * @see backend/src/**/dto/ - Backend DTO definitions
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const UserRole = z.enum(['ADMIN', 'ACCOUNTANT']);

export const TransactionType = z.enum(['INCOME', 'EXPENSE']);

export const PaymentMethod = z.enum(['CASH', 'MASTER']);

export const Currency = z.enum(['USD', 'IQD']);

export const InventoryUnit = z.enum(['KG', 'PIECE', 'LITER', 'OTHER']);

export const DisplayMethod = z.enum(['POPUP', 'TOAST', 'EMAIL', 'SMS']);

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
    .max(100, { message: 'اسم المستخدم يجب ألا يتجاوز 100 حرف' }),
  password: z
    .string()
    .min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'كلمة المرور الحالية مطلوبة' }),
  newPassword: z
    .string()
    .min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
    }),
  confirmPassword: z
    .string()
    .min(1, { message: 'تأكيد كلمة المرور مطلوب' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين',
  path: ['confirmPassword'],
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
    .max(50, { message: 'اسم المستخدم يجب ألا يتجاوز 50 حرف' }),
  password: z
    .string()
    .min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
    }),
  role: UserRole,
  branchId: z.string().uuid({ message: 'معرف الفرع يجب أن يكون UUID صالح' }).optional().nullable(),
});

export const updateUserSchema = z.object({
  role: UserRole.optional(),
  branchId: z.string().uuid({ message: 'معرف الفرع يجب أن يكون UUID صالح' }).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// BRANCH SCHEMAS
// ============================================================================

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الفرع مطلوب' })
    .max(200, { message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' }),
  location: z
    .string()
    .min(1, { message: 'الموقع مطلوب' })
    .max(500, { message: 'الموقع يجب ألا يتجاوز 500 حرف' }),
  managerName: z
    .string()
    .min(1, { message: 'اسم المدير مطلوب' })
    .max(200, { message: 'اسم المدير يجب ألا يتجاوز 200 حرف' }),
  phone: z
    .string()
    .min(1, { message: 'رقم الهاتف مطلوب' })
    .max(50, { message: 'رقم الهاتف يجب ألا يتجاوز 50 حرف' }),
});

export const updateBranchSchema = z.object({
  name: z
    .string()
    .max(200, { message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' })
    .optional(),
  location: z
    .string()
    .max(500, { message: 'الموقع يجب ألا يتجاوز 500 حرف' })
    .optional(),
  managerName: z
    .string()
    .max(200, { message: 'اسم المدير يجب ألا يتجاوز 200 حرف' })
    .optional(),
  phone: z
    .string()
    .max(50, { message: 'رقم الهاتف يجب ألا يتجاوز 50 حرف' })
    .optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const createTransactionSchema = z.object({
  type: TransactionType,
  amount: z
    .number()
    .positive({ message: 'المبلغ يجب أن يكون أكبر من صفر' })
    .finite({ message: 'المبلغ يجب أن يكون رقماً صحيحاً' }),
  currency: Currency.optional(),
  paymentMethod: PaymentMethod.optional(),
  category: z.string().optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: 'التاريخ لا يمكن أن يكون في المستقبل',
    }),
  employeeVendorName: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  type: TransactionType.optional(),
  amount: z
    .number()
    .min(0.01, { message: 'المبلغ يجب أن يكون أكبر من صفر' })
    .optional(),
  paymentMethod: PaymentMethod.optional(),
  category: z.string().optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    })
    .optional(),
  employeeVendorName: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// DEBT SCHEMAS
// ============================================================================

export const createDebtSchema = z.object({
  creditorName: z
    .string()
    .min(1, { message: 'اسم الدائن مطلوب' }),
  amount: z
    .number()
    .positive({ message: 'المبلغ يجب أن يكون أكبر من صفر' })
    .finite({ message: 'المبلغ يجب أن يكون رقماً صحيحاً' }),
  currency: Currency.optional(),
  date: z
    .string()
    .min(1, { message: 'التاريخ مطلوب' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    }),
  dueDate: z
    .string()
    .min(1, { message: 'تاريخ الاستحقاق مطلوب' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'تاريخ الاستحقاق غير صالح',
    }),
  notes: z.string().optional(),
  branchId: z.string().uuid({ message: 'معرف الفرع يجب أن يكون UUID صالح' }).optional(),
}).refine((data) => new Date(data.dueDate) >= new Date(data.date), {
  message: 'تاريخ الاستحقاق يجب أن يكون مساوياً أو بعد تاريخ الدين',
  path: ['dueDate'],
});

export const payDebtSchema = z.object({
  amountPaid: z
    .number()
    .positive({ message: 'المبلغ المدفوع يجب أن يكون أكبر من صفر' })
    .finite({ message: 'المبلغ المدفوع يجب أن يكون رقماً صحيحاً' }),
  currency: Currency.optional(),
  paymentDate: z
    .string()
    .min(1, { message: 'تاريخ الدفع مطلوب' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'تاريخ الدفع غير صالح',
    }),
  notes: z.string().optional(),
});

// ============================================================================
// INVENTORY SCHEMAS
// ============================================================================

export const createInventorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'اسم الصنف يجب أن يكون حرفين على الأقل' }),
  quantity: z
    .number()
    .min(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' }),
  unit: InventoryUnit,
  costPerUnit: z
    .number()
    .min(0, { message: 'تكلفة الوحدة يجب أن تكون أكبر من أو تساوي صفر' }),
  notes: z.string().optional(),
  branchId: z.string().uuid({ message: 'معرف الفرع يجب أن يكون UUID صالح' }).optional(),
});

export const updateInventorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'اسم الصنف يجب أن يكون حرفين على الأقل' })
    .optional(),
  quantity: z
    .number()
    .min(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' })
    .optional(),
  unit: InventoryUnit.optional(),
  costPerUnit: z
    .number()
    .min(0, { message: 'تكلفة الوحدة يجب أن تكون أكبر من أو تساوي صفر' })
    .optional(),
  notes: z.string().optional(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const updateNotificationSettingsSchema = z.object({
  notificationType: z.string(),
  isEnabled: z.boolean().optional(),
  minAmount: z
    .number()
    .min(0, { message: 'الحد الأدنى للمبلغ يجب أن يكون أكبر من أو يساوي صفر' })
    .optional(),
  selectedBranches: z.array(z.string()).optional(),
  displayMethod: DisplayMethod.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type PayDebtInput = z.infer<typeof payDebtSchema>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
